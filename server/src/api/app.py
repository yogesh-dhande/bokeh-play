from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models.session import Session
from services.container import container_service

# from services.validation import register_exception_handlers

app = FastAPI()

origins = [
    "http://localhost:8080",
    "http://localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# register_exception_handlers(app)


@app.on_event("shutdown")
async def shutdown_event():
    print("shuting the server down")
    container_service.stop_all_containers()


@app.get("/backend")
async def root():
    return {"message": "Hello World"}


@app.post("/backend/project")
async def get_script(session: Session):
    return session.project.get_app_script(session.new, query=session.query)
