import json
from enum import Enum
import datetime

dataFolder = "data/"

commonFile = dataFolder + "common.json"
teachersFile = dataFolder + "teachers.json"
classesFile = dataFolder + "classes.json"
recessFile = dataFolder + "recess.json"
subjectsFile = dataFolder + "subjects.json"
studentsFile = dataFolder + "students.json"
classroomsFile = dataFolder + "classrooms.json"
fixedHoursFile = dataFolder + "fixed_hours.json"

trainingDataFolder = dataFolder + "training/"
trainedDataFolder = dataFolder + "trained/"
trainedModelFolder = dataFolder + "trained_models/"

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

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=4)

    @classmethod
    def from_json(cls, json_string: str):
        for data in json.loads(json_string):
            instance = cls()
            instance.from_dict(data)
            yield instance

class FixedHourDataStructure:
    day: str
    name: str
    classroomID: int
    hour: int

    def __init__(self):
        self.day = ""
        self.classroomID = 0
        self.name = ""
        self.hour = 0

    def from_dict(self, data: dict):
        self.day = data.get("day", "")
        self.hour = data.get("hour", 0)
        self.classroomID = data.get("classroomID", 0)
        self.name = data.get("name", "")

    def to_dict(self) -> dict:
        return {
            "day": self.day,
            "hour": self.hour,
            "classroomID": self.classroomID,
            "name": self.name
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=4)

    @classmethod
    def from_json(cls, json_string: str):
        data = json.loads(json_string)
        instance = cls()
        instance.from_dict(data)
        return instance

class SubjectDataStructure:
    name: str
    abbreviation: str
    requiredHours: int
    coreSubject: bool
    requiredClassroomParameters: list[str]

    def __init__(self):
        self.name = ""
        self.abbreviation = ""
        self.requiredHours = 0
        self.coreSubject = False
        self.requiredClassroomParameters = []

    def from_dict(self, data: dict):
        self.name = data.get("name", "")
        self.abbreviation = data.get("abbreviation", "")
        self.requiredHours = data.get("requiredHours", 0)
        self.coreSubject = data.get("coreSubject", False)
        self.requiredClassroomParameters = data.get("requiredClassroomParameters", [])

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "abbreviation": self.abbreviation,
            "requiredHours": self.requiredHours,
            "coreSubject": self.coreSubject,
            "requiredClassroomParameters": self.requiredClassroomParameters
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=4)

    @classmethod
    def from_json(cls, json_string: str):
        for data in json.loads(json_string):
            instance = cls()
            instance.from_dict(data)
            yield instance

class Days(Enum):
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"

class TeachersDataStructure:
    name : str
    abbreviation : str
    availability : dict[Days, int]
    subjects : list[str]

    def __init__(self):
        self.name = ""
        self.abbreviation = ""
        self.availability = {}
        self.subjects = []

    def from_dict(self, data: dict):
        self.name = data.get("name", "")
        self.abbreviation = data.get("abbreviation", "")
        self.availability = data.get("availability", {})
        self.subjects = data.get("subjects", [])

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "abbreviation": self.abbreviation,
            "availability": {str(day.value) if isinstance(day, Days) else str(day): hours for day, hours in self.availability.items()},
            "subjects": self.subjects
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=4)

    @classmethod
    def from_json(cls, json_string: str):
        data = json.loads(json_string)
        instance = cls()
        instance.from_dict(data)
        return instance
    
class Level(Enum):
    MAVO = "mavo"
    HAVO = "havo"
    VWO = "vwo"

class Profile(Enum):
    NT = "nt"
    NG = "ng"
    EM = "em"
    CM = "cm"
    
class StudentDataStructure:
    name: str
    className: str
    profile: Profile
    studentNumber: str
    preferredOddHours: list[int] # optional
    subjects: list[str]

    def __init__(self):
        self.name = ""
        self.className = ""
        self.profile = Profile.NT
        self.studentNumber = ""
        self.preferredOddHours = []
        self.subjects = []

    def from_dict(self, data: dict):
        self.name = data.get("name", "")
        self.className = data.get("className", "")
        self.profile = Profile[data.get("profile", "NT").upper()]
        self.studentNumber = data.get("studentNumber", "")
        self.preferredOddHours = data.get("preferredOddHours", [])
        self.subjects = data.get("subjects", [])
    
    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "className": self.className,
            "profile": self.profile.value,
            "studentNumber": self.studentNumber,
            "preferredOddHours": self.preferredOddHours,
            "subjects": self.subjects
        }
    
    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=4)

    @classmethod
    def from_json(cls, json_string: str):
        data = json.loads(json_string)
        instance = cls()
        instance.from_dict(data)
        return instance

class ClassDataStructure:
    name: str
    year: tuple[Level, int, int] # Level, grade, section(A, B etc.)
    tutor: str # Name of the tutor (the abbreviation)
    students: list[StudentDataStructure] # Populate later when the students have fully loaded from JSON
    coreSubjects: list[str]

    def __init__(self):
        self.name = ""
        self.year = (Level.MAVO, 1, 1)
        self.tutor = ""
        self.coreSubjects = []

    def from_dict(self, data: dict):
        self.name = data.get("name", "")
        self.year = (
            Level[data.get("year", (Level.MAVO, 1, 1))[0].upper()],
            data.get("year", (Level.MAVO, 1, 1))[1],
            data.get("year", (Level.MAVO, 1, 1))[2]
        )
        self.tutor = data.get("tutor", "")
        self.coreSubjects = data.get("coreSubjects", [])

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "year": (self.year[0].value, self.year[1], self.year[2]),
            "tutor": self.tutor,
            "coreSubjects": self.coreSubjects
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=4)

    @classmethod
    def from_json(cls, json_string: str):
        data = json.loads(json_string)
        instance = cls()
        instance.from_dict(data)
        return instance

class HourType(Enum):
    LESSON = "lesson"
    RECESS = "recess"

class Type(Enum):
    EARLY_START_EARLY_END = "early_start_early_end"
    LATE_START_LATE_END = "late_start_late_end"
    BALANCED = "balanced"
    LEAST_ODD_HOURS_STUDENTS = "least_odd_hours_students"
    LEAST_ODD_HOURS_TEACHERS = "least_odd_hours_teachers"

def parse_time(time_str: str) -> datetime.time:
    return datetime.time.fromisoformat(time_str)

class CommonDataStructure:
    hours: list[tuple[HourType, Days, datetime.time, datetime.time]] # List of tuples with hour type, day, start and end time
    preferredOddHoursEnabled : bool
    generationType : Type

    def __init__(self):
        self.hours = []
        self.preferredOddHoursEnabled = False
        self.generationType = Type.BALANCED

    def from_dict(self, data: dict):
        self.hours = [
            (HourType[hour[0].upper()], Days[hour[1].upper()], parse_time(hour[2]), parse_time(hour[3]))
            for hour in data.get("hours", [])
        ]
        self.preferredOddHoursEnabled = data.get("preferredOddHoursEnabled", False)
        self.generationType = Type[str(data.get("generationType", Type.BALANCED)).upper()]

    def to_dict(self) -> dict:
        return {
            "hours": [
                (hour[0].value, hour[1].value, hour[2].isoformat(), hour[3].isoformat())
                for hour in self.hours
            ],
            "preferredOddHoursEnabled": self.preferredOddHoursEnabled,
            "generationType": self.generationType.value
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=4)

    @classmethod
    def from_json(cls, json_string: str):
        data = json.loads(json_string)
        instance = cls()
        instance.from_dict(data)
        return instance

class OutputSubjectDataStructure:
    subjectName: str
    teacherName: str
    classRoomNumber: int
    timeSlot: tuple[HourType, Days, datetime.time, datetime.time]

    def __init__(self, subjectName: str, teacherName: str, classRoomNumber: int, timeSlot: tuple[HourType, Days, datetime.time, datetime.time]):
        self.subjectName = subjectName
        self.teacherName = teacherName
        self.classRoomNumber = classRoomNumber
        self.timeSlot = timeSlot

    def to_dict(self) -> dict:
        return {
            "subjectName": self.subjectName,
            "teacherName": self.teacherName,
            "classRoomNumber": self.classRoomNumber,
            "timeSlot": self.timeSlot
        }

    def from_dict(self, data: dict):
        self.subjectName = data.get("subjectName", "")
        self.teacherName = data.get("teacherName", "")
        self.classRoomNumber = data.get("classRoomNumber", 0)
        self.timeSlot = data.get("timeSlot", (HourType.LESSON, Days.MONDAY, datetime.time(8, 0), datetime.time(9, 0)))

class OutputTeacherScheduleStructure:
    teacherName: str
    schedule: list[OutputSubjectDataStructure]

    def __init__(self, teacherName: str, schedule: list[OutputSubjectDataStructure]):
        self.teacherName = teacherName
        self.schedule = schedule

    def to_dict(self) -> dict:
        return {
            "teacherName": self.teacherName,
            "schedule": [subject.to_dict() for subject in self.schedule]
        }

    def from_dict(self, data: dict):
        self.teacherName = data.get("teacherName", "")
        self.schedule = []
        for subject in data.get("schedule", []):
            s = OutputSubjectDataStructure(
                subjectName=subject["subjectName"],
                teacherName=subject["teacherName"],
                classRoomNumber=subject["classRoomNumber"],
                timeSlot=tuple(subject["timeSlot"])
            )
            self.schedule.append(s)

class OutputStudentScheduleStructure:
    studentName: str
    schedule: list[OutputSubjectDataStructure]

    def __init__(self, studentName: str, schedule: list[OutputSubjectDataStructure]):
        self.studentName = studentName
        self.schedule = schedule

    def to_dict(self) -> dict:
        return {
            "studentName": self.studentName,
            "schedule": [subject.to_dict() for subject in self.schedule]
        }

    def from_dict(self, data: dict):
        self.studentName = data.get("studentName", "")
        self.schedule = []
        for subject in data.get("schedule", []):
            s = OutputSubjectDataStructure(
                subjectName=subject["subjectName"],
                teacherName=subject["teacherName"],
                classRoomNumber=subject["classRoomNumber"],
                timeSlot=tuple(subject["timeSlot"])
            )
            self.schedule.append(s)

class OutputDataStructure():
    teacherSchedules: list[OutputTeacherScheduleStructure]
    studentSchedules: list[OutputStudentScheduleStructure]

    def __init__(self, teacherSchedules: list[OutputTeacherScheduleStructure], studentSchedules: list[OutputStudentScheduleStructure]):
        self.teacherSchedules = teacherSchedules
        self.studentSchedules = studentSchedules

    def to_dict(self) -> dict:
        return {
            "teacherSchedules": [schedule.to_dict() for schedule in self.teacherSchedules],
            "studentSchedules": [schedule.to_dict() for schedule in self.studentSchedules]
        }

    def from_dict(self, data: dict):
        self.teacherSchedules = [
            OutputTeacherScheduleStructure(**schedule) for schedule in data.get("teacherSchedules", [])
        ]
        self.studentSchedules = [
            OutputStudentScheduleStructure(**schedule) for schedule in data.get("studentSchedules", [])
        ]

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=4)

    def from_json(self, json_string: str):
        data = json.loads(json_string)
        self.from_dict(data)

def load_all_data():
    teachers = [TeachersDataStructure.from_json(json.dumps(t)) for t in load_json_file(teachersFile)]
    classes = [ClassDataStructure.from_json(json.dumps(c)) for c in load_json_file(classesFile)]
    subjects = [SubjectDataStructure.from_json(json.dumps(s)) for s in load_json_file(subjectsFile)]
    classrooms = [ClassroomDataStructure.from_json(json.dumps(c)) for c in load_json_file(classroomsFile)]
    fixed_hours = [FixedHourDataStructure.from_json(json.dumps(f)) for f in load_json_file(fixedHoursFile)]
    common = CommonDataStructure.from_json(json.dumps(load_json_file(commonFile)))
    return teachers, classes, subjects, classrooms, fixed_hours, common