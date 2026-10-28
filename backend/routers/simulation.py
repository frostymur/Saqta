from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.services.simulator import simulator
from backend.schemas import SimulationScenarioRequest

router = APIRouter(prefix="/api/simulation", tags=["Симуляция паводка"])


@router.get("/status")
def get_simulation_status():
    return {
        "is_running": simulator.is_running,
        "scenario": simulator.scenario,
        "intensity": simulator.intensity,
        "step_count": simulator.step_count
    }


@router.post("/start")
def start_simulation(interval_seconds: int = 4):
    simulator.start(interval_seconds=interval_seconds)
    return {
        "status": "started",
        "interval_seconds": interval_seconds,
        "scenario": simulator.scenario
    }


@router.post("/stop")
def stop_simulation():
    simulator.stop()
    return {
        "status": "stopped",
        "step_count": simulator.step_count
    }


@router.post("/step")
async def trigger_step(db: Session = Depends(get_db)):
    await simulator.execute_step(db=db)
    return {
        "status": "step_executed",
        "scenario": simulator.scenario,
        "step_count": simulator.step_count
    }


@router.post("/scenario")
def set_scenario(payload: SimulationScenarioRequest):
    simulator.set_scenario(scenario=payload.scenario, intensity=payload.intensity)
    return {
        "status": "scenario_updated",
        "scenario": simulator.scenario,
        "intensity": simulator.intensity
    }
