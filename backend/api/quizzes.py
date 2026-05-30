from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Any

from core.db import get_db
from api.users import get_current_user
from models.user_quiz import UserQuiz

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])


class QuizCreateRequest(BaseModel):
    id: str
    subject: str
    type: str
    question: str
    options: list[str] | None = None
    correct_index: int | None = None
    answer: str | None = None
    hint: str | None = None
    created_at: str | None = None


class QuizVoteRequest(BaseModel):
    vote: str   # 'up' | 'down'


def _serialize(q: UserQuiz) -> dict[str, Any]:
    return {
        "id": q.id,
        "subject": q.subject,
        "type": q.type,
        "question": q.question,
        "options": q.options,
        "correct_index": q.correct_index,
        "answer": q.answer,
        "hint": q.hint,
        "upvotes": q.upvotes,
        "downvotes": q.downvotes,
        "report_count": q.report_count,
        "created_at": q.created_at.isoformat() if q.created_at else q.created_at,
    }


@router.get("")
async def get_quizzes(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    quizzes = db.query(UserQuiz).filter_by(user_id=current_user.id).all()
    return [_serialize(q) for q in quizzes]


@router.post("", status_code=201)
async def create_quiz(
    body: QuizCreateRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if db.query(UserQuiz).filter_by(id=body.id).first():
        raise HTTPException(status_code=409, detail="이미 존재하는 퀴즈입니다")

    quiz = UserQuiz(
        id=body.id,
        user_id=current_user.id,
        subject=body.subject,
        type=body.type,
        question=body.question,
        options=body.options,
        correct_index=body.correct_index,
        answer=body.answer,
        hint=body.hint,
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return _serialize(quiz)


@router.delete("/{quiz_id}", status_code=204)
async def delete_quiz(
    quiz_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    quiz = db.query(UserQuiz).filter_by(id=quiz_id, user_id=current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="퀴즈를 찾을 수 없습니다")
    db.delete(quiz)
    db.commit()


@router.post("/{quiz_id}/vote")
async def vote_quiz(
    quiz_id: str,
    body: QuizVoteRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    quiz = db.query(UserQuiz).filter_by(id=quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="퀴즈를 찾을 수 없습니다")

    if body.vote == "up":
        quiz.upvotes += 1
    elif body.vote == "down":
        quiz.downvotes += 1

    db.commit()
    return {"upvotes": quiz.upvotes, "downvotes": quiz.downvotes}


@router.post("/{quiz_id}/report")
async def report_quiz(
    quiz_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    quiz = db.query(UserQuiz).filter_by(id=quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="퀴즈를 찾을 수 없습니다")

    quiz.report_count += 1
    db.commit()
    return {"report_count": quiz.report_count}
