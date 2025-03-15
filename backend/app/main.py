from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from .routers import teams, drivers, races, results

app = FastAPI(title="F1 Fantasy API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(teams.router, prefix="/api", tags=["teams"])
app.include_router(drivers.router, prefix="/api", tags=["drivers"])
app.include_router(races.router, prefix="/api", tags=["races"])
app.include_router(results.router, prefix="/api", tags=["results"])


@app.get("/")
async def root():
    return {"message": "Welcome to F1 Fantasy API"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True) 