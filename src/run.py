import sys
import os
import json
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from datastructure import *

from ortools.sat.python import cp_model

class Run:
    def __init__(self) -> None:
        self.model = cp_model.CpModel()
        self.solver = cp_model.CpSolver()

        self.teachers = []
        for d in load_json_file(teachersFile):
            t = TeachersDataStructure()
            t.from_dict(d)
            self.teachers.append(t)
        self.classes = []
        for d in load_json_file(classesFile):
            c = ClassDataStructure()
            c.from_dict(d)
            self.classes.append(c)

        self.subjects = []
        for d in load_json_file(subjectsFile):
            s = SubjectDataStructure()
            s.from_dict(d)
            self.subjects.append(s)

        self.classrooms = []
        for d in load_json_file(classroomsFile):
            cr = ClassroomDataStructure()
            cr.from_dict(d)
            self.classrooms.append(cr)

        self.fixed_hours = []
        for d in load_json_file(fixedHoursFile):
            fh = FixedHourDataStructure()
            fh.from_dict(d)
            self.fixed_hours.append(fh)
        self.common = CommonDataStructure.from_json(json.dumps(load_json_file(commonFile)))

        self.teacher_names = [t.name for t in self.teachers]
        self.class_names = [c.name for c in self.classes]
        self.subject_names = [s.name for s in self.subjects]
        self.classroom_numbers = [cr.number for cr in self.classrooms]
        #print(self.classroom_numbers)
        # Only use lesson slots
        self.time_slots = [t for t in self.common.hours if t[0] == HourType.LESSON] # tuple[HourType, Days, datetime.time, datetime.time]


        # Decision Variables - now including class information
        x = {}
        for class_name in self.class_names:
            for subject in self.subject_names:
                for teacher in self.teacher_names:
                    for time in self.time_slots:
                        for room in self.classroom_numbers:
                            x[(class_name, subject, teacher, time, room)] = self.model.NewBoolVar(f'x_{class_name}_{subject}_{teacher}_{time}_{room}')

        # Teacher qualification constraint: only allow teacher to teach subjects they are qualified for
        teacher_subjects = {t.name: set(t.subjects) for t in self.teachers}
        for class_name in self.class_names:
            for subject in self.subject_names:
                for teacher in self.teacher_names:
                    if subject not in teacher_subjects.get(teacher, set()):
                        for time in self.time_slots:
                            for room in self.classroom_numbers:
                                self.model.Add(x[(class_name, subject, teacher, time, room)] == 0)

        # Class-subject constraint: each class gets required hours for their core subjects
        class_subjects = {c.name: set(c.coreSubjects) for c in self.classes}
        for class_name, class_obj in zip(self.class_names, self.classes):
            for subject in class_obj.coreSubjects:
                if subject in self.subject_names:
                    subject_obj = next((s for s in self.subjects if s.name == subject), None)
                    if subject_obj:
                        self.model.Add(sum(x[(class_name, subject, teacher, time, room)]
                                           for teacher in self.teacher_names
                                             for time in self.time_slots
                                               for room in self.classroom_numbers) == subject_obj.requiredHours)
        
        # Ensure classes only get subjects that are in their core subjects
        for class_name in self.class_names:
            class_core_subjects = class_subjects.get(class_name, set())
            for subject in self.subject_names:
                if subject not in class_core_subjects:
                    for teacher in self.teacher_names:
                        for time in self.time_slots:
                            for room in self.classroom_numbers:
                                self.model.Add(x[(class_name, subject, teacher, time, room)] == 0)

        # Teacher can only teach one class at a time
        for teacher in self.teacher_names:
            for time in self.time_slots:
                self.model.Add(sum(x[(class_name, subject, teacher, time, room)]
                                   for class_name in self.class_names
                                     for subject in self.subject_names
                                       for room in self.classroom_numbers) <= 1)

        # Room can only be used by one class at a time
        for room in self.classroom_numbers:
            for time in self.time_slots:
                self.model.Add(sum(x[(class_name, subject, teacher, time, room)]
                                   for class_name in self.class_names
                                     for subject in self.subject_names
                                       for teacher in self.teacher_names) <= 1)

        # Class can only have one lesson at a time
        for class_name in self.class_names:
            for time in self.time_slots:
                self.model.Add(sum(x[(class_name, subject, teacher, time, room)]
                                   for subject in self.subject_names
                                     for teacher in self.teacher_names
                                       for room in self.classroom_numbers) <= 1)

        # Teacher availability constraint
        # Build a mapping: for each day, a list of lesson slots (in order)
        day_to_lesson_slots = {}
        for t in self.time_slots:
            day = t[1]
            if day not in day_to_lesson_slots:
                day_to_lesson_slots[day] = []
            day_to_lesson_slots[day].append(t)

        teacher_availability = {t.name: t.availability for t in self.teachers}
        for teacher in self.teacher_names:
            availability = teacher_availability.get(teacher, {})
            for time in self.time_slots:
                day = time[1]  # e.g., 'monday'
                lesson_slots_today = day_to_lesson_slots.get(day, [])
                lesson_index = lesson_slots_today.index(time) + 1 if time in lesson_slots_today else -1
                if day.value not in availability:
                    print("not")
                    # Teacher not available at all on this day
                    for class_name in self.class_names:
                        for subject in self.subject_names:
                            for room in self.classroom_numbers:
                                self.model.Add(x[(class_name, subject, teacher, time, room)] == 0)
                else:
                    available_hours = availability.get(day.value, [])
                    #print(availability)
                    if not isinstance(available_hours, list):
                        available_hours = [available_hours]
                    if lesson_index not in available_hours:
                        # Not available: force all x[...] for this teacher, time to 0
                        for class_name in self.class_names:
                            for subject in self.subject_names:
                                for room in self.classroom_numbers:
                                    self.model.Add(x[(class_name, subject, teacher, time, room)] == 0)
        
        # Solve the model and collect results into a list to produce valid JSON
        results = []

        status = self.solver.Solve(self.model)
        if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            for class_name in self.class_names:
                for subject in self.subject_names:
                    for teacher in self.teacher_names:
                        for time in self.time_slots:
                            for room in self.classroom_numbers:
                                if self.solver.Value(x[(class_name, subject, teacher, time, room)]) == 1:
                                    lesson_index = day_to_lesson_slots.get(time[1], []).index(time)
                                    print(f' - {subject} with {teacher} for {class_name} at {time[1].value} : {lesson_index} in {room}')
                                    results.append({
                                        "subject": subject,
                                        "teacher": teacher,
                                        "class": class_name,
                                        "day": time[1].value,
                                        "lesson_index": lesson_index,
                                        "classroom": room
                                    })
        else:
            print('No solution found.')

        os.makedirs("data/out", exist_ok=True)
        with open("data/out/generated.json", "w", encoding="utf-8") as file:
            json.dump(results, file, indent=2, ensure_ascii=False)

        print(f'Solver status: {self.solver.StatusName(status)}')
        print(f'Solver status: {self.solver.StatusName(status)}')

run = Run()