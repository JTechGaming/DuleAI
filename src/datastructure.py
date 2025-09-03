import json
from enum import Enum

dataFolder = "../data/"

teachersFile = dataFolder + "teachers.json"
classesFile = dataFolder + "classes.json"
recessFile = dataFolder + "recess.json"
subjectsFile = dataFolder + "subjects.json"
studentsFile = dataFolder + "students.json"
classroomsFile = dataFolder + "classrooms.json"
fixedHoursFile = dataFolder + "fixed_hours.json"
    
def load_json_file(file_path):
    with open(file_path, "r") as file:
        return json.load(file)

def save_json_file(file_path, data):
    with open(file_path, "w") as file:
        json.dump(data, file, indent=4)

class ClassroomSpecialties(Enum):
    COMPUTERS = "computers"
    SCIENCE = "science"
    ART = "art"
    MUSIC = "music"
    SPORTS = "sports"
    STUDYPLAZA = "studyplaza"
    GYM = "gym"
    LIBRARY = "library"
    CAFETERIA = "cafeteria"
    AUDITORIUM = "auditorium"

    @classmethod
    def parse(cls, value: str):
        try:
            return cls[value.upper()]
        except KeyError:
            raise ValueError(f"Unknown specialty: {value}")


class ClassroomDataStructure:
    number : int
    capacity : int
    specialties : list[ClassroomSpecialties]

    def __init__(self):
        self.number = 0
        self.capacity = 0
        self.specialties = []

    def from_dict(self, data: dict):
        self.number = data.get("number", 0)
        self.capacity = data.get("capacity", 0)
        self.specialties = [ClassroomSpecialties.parse(s) for s in data.get("specialties", [])]

    def to_dict(self) -> dict:
        return {
            "number": self.number,
            "capacity": self.capacity,
            "specialties": [s.value for s in self.specialties]
        }