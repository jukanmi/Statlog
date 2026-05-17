import React, { useState } from "react";
import { ShieldAlert, Loader2 } from "lucide-react";

interface Props {
    onSuccess: () => void;
    onCancel: () => void;
}

export const VerificationPopup: React.FC<Props> = ({ onSuccess, onCancel }) => {
    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // 나중에 바꿔야됨
    const verifyWithAI = async (text: string) => {
        // 나중에 바꿔야됨
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // 나중에 바꿔야됨
        if (text.length < 5) {
            return { isValid: false, reason: "입력된 텍스트가 너무 짧습니다." };
        }

        return { isValid: true, reason: "통과" };
    };

    const handleSubmit = async () => {
        if (!inputText.trim()) {
            setErrorMessage("텍스트를 입력해주세요.");
            return;
        }

        setIsLoading(true);
        setErrorMessage("");

        try {
            const result = await verifyWithAI(inputText);

            if (result.isValid) {
                onSuccess();
            } else {
                setErrorMessage(result.reason);
            }
        } catch (error) {
            setErrorMessage("검증 중 오류가 발생했습니다. 다시 시도해주세요.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-[#1C1C28] border border-red-500/50 shadow-lg rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-cetner gap-3 text-red-400">
                <ShieldAlert className="w-8 h-8" />
                <h2 className="text-xl font-bold">집중력 기습 체크!</h2>
            </div>

            <p className="text-gray-300 text-sm">
                방금 공부한 내용의 <b>핵심 단어나 문장</b>을 입력해 주세요.
            </p>

            <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isLoading}
                className="w-full bg-black/50 border-gray-600 rounded p-3 text-white disabled:opacity-50"
                placeholder="ㅇㅇㅇ"
            />

            {errorMessage && <p className="text-red-400 text-sm font-medium">{errorMessage}</p>}

            <div className="flex gap-2">
                <button
                    onClick={onCancel}
                    disabled={isLoading}
                    className="flex-1 py-3 rounded bg-gray-700 hover:bg-gray-600 text-white font-bold disabled:opacity-50"
                >
                    취소 (돌아가기)
                </button>

                <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="flex-1 py-3 rounded bg-red-500 hover:bg-red-600 text-white font-bold flex justify-center items-cetner gap-2 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                검증 중...
                            </>
                        ) : (
                            '검증하기'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};