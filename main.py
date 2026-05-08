from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Hello World"}

@app.post("/analyze")
def analyze(content: str):
    return {"category": "TEC", "exp": 100}