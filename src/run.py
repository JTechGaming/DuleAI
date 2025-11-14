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
        
        # Fixed Hours Constraint: Reserve specific time slots for fixed activities
        for fixed_hour in self.fixed_hours:
            # Find the matching time slot
            fixed_day = Days[fixed_hour.day.upper()]
            fixed_lesson_index = fixed_hour.hour - 1  # Convert 1-based to 0-based index
            
            # Find the time slot that matches this day and lesson index
            matching_time_slot = None
            day_slots = day_to_lesson_slots.get(fixed_day, [])
            if 0 <= fixed_lesson_index < len(day_slots):
                matching_time_slot = day_slots[fixed_lesson_index]
            
            if matching_time_slot:
                # Block this time slot and classroom from being used by regular classes
                fixed_classroom = int(fixed_hour.classroomID) if isinstance(fixed_hour.classroomID, str) else fixed_hour.classroomID
                
                for class_name in self.class_names:
                    for subject in self.subject_names:
                        for teacher in self.teacher_names:
                            if fixed_classroom in self.classroom_numbers:
                                # Block the specific classroom
                                self.model.Add(x[(class_name, subject, teacher, matching_time_slot, fixed_classroom)] == 0)
                            # Also block this time slot for all classrooms if it's a class-specific fixed hour
                            # (You can modify this logic based on your specific requirements)
        
        # Optimization objective based on generation type
        if self.common.generationType == Type.LEAST_ODD_HOURS_STUDENTS:
            # Simplified approach: minimize gaps by encouraging consecutive lessons
            gap_penalties = []
            
            for class_name in self.class_names:
                for day in Days:
                    day_slots = day_to_lesson_slots.get(day, [])
                    if len(day_slots) <= 2:
                        continue
                    
                    # Simple approach: for each day, penalize having lessons at non-consecutive times
                    # Create boolean variables for whether class has a lesson in each slot
                    lesson_vars = []
                    for i, time_slot in enumerate(day_slots):
                        has_lesson = self.model.NewBoolVar(f'has_lesson_{class_name}_{day.value}_{i}')
                        self.model.Add(has_lesson == sum(x[(class_name, subject, teacher, time_slot, room)]
                                                        for subject in self.subject_names
                                                        for teacher in self.teacher_names
                                                        for room in self.classroom_numbers))
                        lesson_vars.append(has_lesson)
                    
                    # Add penalty for gaps: if lesson[i] = 1 and lesson[i+2] = 1 but lesson[i+1] = 0
                    for i in range(len(lesson_vars) - 2):
                        gap_penalty = self.model.NewBoolVar(f'gap_penalty_{class_name}_{day.value}_{i}')
                        # gap_penalty = 1 if lesson[i] = 1 AND lesson[i+1] = 0 AND lesson[i+2] = 1
                        self.model.Add(gap_penalty <= lesson_vars[i])
                        self.model.Add(gap_penalty <= 1 - lesson_vars[i + 1])
                        self.model.Add(gap_penalty <= lesson_vars[i + 2])
                        self.model.Add(gap_penalty >= lesson_vars[i] + (1 - lesson_vars[i + 1]) + lesson_vars[i + 2] - 2)
                        gap_penalties.append(gap_penalty)
            
            # Minimize total gap penalties (keep it simple)
            if gap_penalties:
                self.model.Minimize(sum(gap_penalties))
        
        # Solve the model and collect results into a list to produce valid JSON
        results = []

        # Set solver parameters for better performance
        self.solver.parameters.max_time_in_seconds = 30  # 30 seconds max for any optimization
        self.solver.parameters.num_search_workers = 4  # Use multiple threads
        
        if self.common.generationType == Type.LEAST_ODD_HOURS_STUDENTS:
            # For complex optimization, allow slightly more time but with early termination
            self.solver.parameters.max_time_in_seconds = 45
            # Stop when we find a reasonably good solution
            self.solver.parameters.cp_model_presolve = True
        
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
            if status == cp_model.INFEASIBLE:
                print('No solution found - problem is infeasible.')
            elif status == cp_model.MODEL_INVALID:
                print('No solution found - model is invalid.')
            else:
                print(f'No solution found - solver status: {self.solver.StatusName(status)}')

        # Add fixed hours to the results
        for fixed_hour in self.fixed_hours:
            fixed_day = Days[fixed_hour.day.upper()]
            fixed_lesson_index = fixed_hour.hour - 1  # Convert 1-based to 0-based index
            
            # Find the matching day slots to get the correct lesson index
            day_slots = day_to_lesson_slots.get(fixed_day, [])
            if 0 <= fixed_lesson_index < len(day_slots):
                fixed_classroom = int(fixed_hour.classroomID) if isinstance(fixed_hour.classroomID, str) else fixed_hour.classroomID
                
                results.append({
                    "subject": fixed_hour.name,
                    "teacher": "Fixed Activity",
                    "class": "All Classes",
                    "day": fixed_day.value,
                    "lesson_index": fixed_lesson_index,
                    "classroom": fixed_classroom
                })
                print(f' - {fixed_hour.name} (Fixed) for All Classes at {fixed_day.value} : {fixed_lesson_index} in {fixed_classroom}')

        # Use absolute path for output
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(script_dir)
        output_dir = os.path.join(project_root, "data", "out")
        output_file = os.path.join(output_dir, "generated.json")
        
        os.makedirs(output_dir, exist_ok=True)
        with open(output_file, "w", encoding="utf-8") as file:
            json.dump(results, file, indent=2, ensure_ascii=False)

        print(f'Solver status: {self.solver.StatusName(status)}')
        print(f'Solve time: {self.solver.WallTime():.2f} seconds')
        if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            print(f'Generated {len(results)} lessons')
        print(f'Solver status: {self.solver.StatusName(status)}')

run = Run()
