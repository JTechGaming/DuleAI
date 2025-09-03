import torch
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
import src.datastructure as ds

trainingDataFolder = "../data/training/"

def load_latest_version():
    latest_version = max([int(f.split('_')[-1].split('.')[0]) for f in os.listdir(ds.trainedModelFolder) if f.endswith('.pt')], default=0)
    print("No trained models found.")
    return latest_version

model_version = load_latest_version()

def save_model(model: torch.nn.Module, filename: str):
    torch.save(model.state_dict(), os.path.join(ds.trainedModelFolder, filename))
    print(f"Model saved to {os.path.join(ds.trainedModelFolder, filename)}")
