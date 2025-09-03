import os
import random
import datetime
import json
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from src.datastructure import (
	ClassroomSpecialties, ClassroomDataStructure, SubjectDataStructure,
	TeachersDataStructure, StudentDataStructure, ClassDataStructure,
	CommonDataStructure, Days, Level, Profile, Type, HourType,
	save_json_file
)

DATA_DIR = os.path.join(os.path.dirname(__file__), '../../data/training/')
os.makedirs(DATA_DIR, exist_ok=True)

def random_name(prefix, idx):
	return f"{prefix}_{idx}"  # Simple name generator

def generate_classrooms(n=5):
	classrooms = []
	for i in range(n):
		c = ClassroomDataStructure()
		c.number = i + 1
		c.capacity = random.randint(20, 35)
		c.specialties = random.sample(list(ClassroomSpecialties), k=random.randint(1, 3))
		classrooms.append(c.to_dict())
	return classrooms

def generate_subjects(n=8):
	subject_names = ["Math", "English", "Biology", "Chemistry", "History", "Art", "Music", "PE"]
	subjects = []
	for i in range(n):
		s = SubjectDataStructure()
		s.name = subject_names[i % len(subject_names)]
		s.abbreviation = s.name[:3].upper()
		s.requiredHours = random.randint(2, 5)
		s.coreSubject = i < 4
		s.requiredClassroomParameters = [random.choice(list(ClassroomSpecialties)).value]
		subjects.append(s.to_dict())
	return subjects

def generate_teachers(n=6, subject_abbrs=None):
	if subject_abbrs is None:
		subject_abbrs = ["MAT", "ENG", "BIO", "CHE", "HIS", "ART", "MUS", "PE"]
	teachers = []
	for i in range(n):
		t = TeachersDataStructure()
		t.name = random_name("Teacher", i)
		t.abbreviation = f"T{i+1}"
		t.availability = {d: random.randint(4, 8) for d in Days}
		t.subjects = random.sample(subject_abbrs, k=min(len(subject_abbrs), random.randint(1, 3)))
		teachers.append(t.to_dict())
	return teachers

def generate_students(n=30, class_names=None, subject_abbrs=None):
	if class_names is None:
		class_names = ["Class_A", "Class_B", "Class_C"]
	if subject_abbrs is None:
		subject_abbrs = ["MAT", "ENG", "BIO", "CHE", "HIS", "ART", "MUS", "PE"]
	students = []
	for i in range(n):
		s = {
			"name": random_name("Student", i),
			"className": random.choice(class_names),
			"profile": random.choice(list(Profile)).value,
			"studentNumber": f"S{i+1:03d}",
			"preferredOddHours": random.sample(range(1, 8), k=random.randint(0, 3)),
			"subjects": random.sample(subject_abbrs, k=min(len(subject_abbrs), random.randint(3, 6)))
		}
		students.append(s)
	return students

def generate_classes(n=3, students=None, subject_abbrs=None):
	if subject_abbrs is None:
		subject_abbrs = ["MAT", "ENG", "BIO", "CHE"]
	classes = []
	for i in range(n):
		c = ClassDataStructure()
		c.name = f"Class_{chr(65+i)}"
		c.year = (random.choice(list(Level)), random.randint(1, 6), i+1)
		c.tutor = f"T{i+1}"
		c.coreSubjects = subject_abbrs[:4]
		# Assign students to class (not used in dict)
		c.students = [StudentDataStructure() for _ in range(0)]
		classes.append(c.to_dict())
	return classes

def generate_common():
	common = CommonDataStructure()
	# Generate 7 hours per day, 5 days
	for day in Days:
		for h in range(8, 15):
			start = datetime.time(h, 0)
			end = datetime.time(h+1, 0)
			common.hours.append((HourType.LESSON, day, start, end))
	common.preferredOddHoursEnabled = True
	common.generationType = Type.BALANCED
	return common.to_dict()

def main():
	classrooms = generate_classrooms()
	subjects = generate_subjects()
	subject_abbrs = [s["abbreviation"] for s in subjects]
	teachers = generate_teachers(subject_abbrs=subject_abbrs)
	class_names = [f"Class_{chr(65+i)}" for i in range(3)]
	students = generate_students(class_names=class_names, subject_abbrs=subject_abbrs)
	classes = generate_classes(students=students, subject_abbrs=subject_abbrs)
	common = generate_common()

	save_json_file(os.path.join(DATA_DIR, "classrooms.json"), classrooms)
	save_json_file(os.path.join(DATA_DIR, "subjects.json"), subjects)
	save_json_file(os.path.join(DATA_DIR, "teachers.json"), teachers)
	save_json_file(os.path.join(DATA_DIR, "students.json"), students)
	save_json_file(os.path.join(DATA_DIR, "classes.json"), classes)
	save_json_file(os.path.join(DATA_DIR, "common.json"), common)
	print(f"Synthetic data generated in {DATA_DIR}")

if __name__ == "__main__":
	main()
