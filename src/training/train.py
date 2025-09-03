import torch
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
import src.datastructure as ds

trainingDataFolder = "../data/training/"
trainedModelFolder = "../data/trained_models/"

def load_latest_version():
    latest_version = max([int(f.split('_')[-1].split('.')[0]) for f in os.listdir(trainedModelFolder) if f.endswith('.pt')], default=0)
    print("No trained models found.")
    return latest_version

model_version = load_latest_version()

def save_model(model: torch.nn.Module, filename: str):
    torch.save(model.state_dict(), os.path.join(trainedModelFolder, filename))
    print(f"Model saved to {os.path.join(trainedModelFolder, filename)}")

