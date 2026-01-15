import pandas as pd
import random
from datetime import datetime, timedelta

class StrictoBrain:
    """
    Professional Coaching Logic Engine with Spaced Repetition.
    Implements 3/7/21 days revision cycle for permanent retention.
    """
    
    def __init__(self, task_db):
        self.kb = task_db
    
    def get_performance_adjustment(self, completion_history):
        """
        FEATURE #2: Performance-Based Task Adjustment
        Analyzes student's completion rate and suggests adaptive changes
        
        Args:
            completion_history: dict with subject-wise completion rates
                Example: {"Math": 0.45, "English": 0.85, "Reasoning": 0.60}
        
        Returns:
            dict with adjustment factors for each subject
        """
        adjustments = {}
        
        for subject, completion_rate in completion_history.items():
            # Default: no adjustment
            task_count_multiplier = 1.0
            difficulty_level = "normal"
            
            # STRUGGLING (< 50% completion) - Reduce load, easier tasks
            if completion_rate < 0.5:
                task_count_multiplier = 0.7  # 30% fewer tasks
                difficulty_level = "easier"
                print(f"📉 [ADAPT] {subject}: Low completion ({completion_rate:.0%}), reducing tasks by 30%")
            
            # DOING GREAT (> 80% completion) - Can handle more
            elif completion_rate > 0.8:
                task_count_multiplier = 1.2  # 20% more tasks
                difficulty_level = "harder"
                print(f"📈 [ADAPT] {subject}: High completion ({completion_rate:.0%}), increasing challenge by 20%")
            
            # NORMAL (50-80%) - Keep current pace
            else:
                print(f"✅ [ADAPT] {subject}: Steady progress ({completion_rate:.0%}), maintaining current level")
            
            adjustments[subject] = {
                "task_multiplier": task_count_multiplier,
                "difficulty": difficulty_level,
                "completion_rate": completion_rate
            }
        
        return adjustments
        
    def get_strategy(self, subject, level, exam_stage, days_left, syllabus_percent=0, user_type='repeater', daily_hours=6):
        """
        Advanced Coaching Strategy with Spaced Repetition & Progressive Mocks
        """
        strategies = []
        
        # ============================================
        # DAILY HABITS (ALL STUDENTS) - DYNAMIC TIME
        # ============================================
        # Allocate time based on daily_hours: 5+ hrs = 40min/20min, <5 hrs = 30min/20min
        # USER REQUIREMENT: MAX caps - Editorial 1hr, Calculation 30min
        if daily_hours >= 5:
            editorial_time = min(0.67, 1.0)  # 40 minutes, MAX 1 hour
            calculation_time = min(0.33, 0.5)  # 20 minutes, MAX 30 min
        else:
            editorial_time = min(0.5, 1.0)  # 30 minutes, MAX 1 hour  
            calculation_time = min(0.33, 0.5)  # 20 minutes, MAX 30 min
        
        if subject == 'English':
            strategies.append(("Learning", "Editorial Reading (The Hindu)", editorial_time))
            
        if subject == 'Math':
            strategies.append(("Practice", "Speed Calculation Drill", calculation_time))
        
        # ============================================
        # GENERAL AWARENESS (GA) LOGIC
        # ============================================
        if subject == 'GA':
            # Static GK - Part of Foundation/Regular Study
            strategies.append(("Learning", "Static GK Chapter", 1.0))
            
            # Current Affairs - ONLY for Mains Preparation
            # Prelims mein CA nahi aata, but Mains ke liye 60 days pehle se start
            if days_left <= 60:
                strategies.append(("Learning", "Daily Current Affairs (For Mains)", 1.0))
                # Weekend Revision
                strategies.append(("Revision", "Weekly Current Affairs Revision (Weekend)", 0.5))
            
            # For Repeaters - GA syllabus from start
            if user_type == 'repeater':
                strategies.append(("Practice", "GA Static GK Practice Questions", 1.0))
            
            return strategies
        
        # ============================================
        # SPACED REPETITION LOGIC (3/7/21 System)
        # ============================================
        # FEATURE #1: Automatic review tasks based on completion dates
        # Implements 3-day, 7-day, and 21-day review cycles for permanent retention
        
        def get_spaced_repetition_tasks(self, topic_completion_history, subject):
            """
            Generate review tasks based on 3/7/21 day spaced repetition
            
            Args:
                topic_completion_history: dict of {topic_name: completion_date_string}
                    Example: {"Algebra Basics": "2024-01-10", "Geometry": "2024-01-05"}
                subject: Current subject being processed
                
            Returns:
                list of review task tuples: [(type, description, duration), ...]
            """
            if not topic_completion_history:
                return []
            
            review_tasks = []
            today = datetime.now().date()
            
            for topic_name, completion_date_str in topic_completion_history.items():
                try:
                    completion_date = datetime.strptime(completion_date_str, '%Y-%m-%d').date()
                    days_since_completion = (today - completion_date).days
                    
                    # 3-Day Review (First reinforcement)
                    if days_since_completion == 3:
                        review_tasks.append(("Revision", f"3-Day Review: {topic_name}", 0.5))
                        print(f"📝 [SPACED] Adding 3-day review for {topic_name}")
                    
                    # 7-Day Review (Second reinforcement)
                    elif days_since_completion == 7:
                        review_tasks.append(("Revision", f"7-Day Review: {topic_name}", 0.75))
                        print(f"📝 [SPACED] Adding 7-day review for {topic_name}")
                    
                    # 21-Day Review (Long-term retention)
                    elif days_since_completion == 21:
                        review_tasks.append(("Revision", f"21-Day Review: {topic_name}", 1.0))
                        print(f"📝 [SPACED] Adding 21-day review for {topic_name}")
                    
                except ValueError:
                    print(f"⚠️ [SPACED] Invalid date format for {topic_name}: {completion_date_str}")
                    continue
            
            return review_tasks
        
        # Apply spaced repetition for BOTH beginners and repeaters
        # This is called in generate_task() with topic_completion_history parameter
        # ============================================
        # BEGINNER STRATEGY
        # ============================================
        if user_type == 'beginner':
            # Phase 1: Foundation (0-60%)
            if syllabus_percent < 60:
                strategies.append(("Learning", "Foundation Concept Building", 1.5))
                strategies.append(("Practice", "Basic Practice Questions", 1.0))
                
            # Phase 2: Practice + Sectional Mocks (60-80%)
            elif syllabus_percent < 80:
                strategies.append(("Learning", "Advanced Concept Revision", 1.0))
                strategies.append(("Practice", "Moderate Practice (50 Questions)", 1.5))
                
                # Sectional Mock after 50%
                if syllabus_percent >= 50:
                    strategies.append(("Test", "Sectional Mock (Subject-wise)", 1.0))
            
            # Phase 3: Full Mock Phase (80%+)
            else:
                strategies.append(("Practice", "Previous Year Questions", 1.0))
                
                # MOCK STRATEGY - Depends on exam_stage
                if exam_stage == 'Prelims':
                    # Pre exam phase - Only Prelims mocks
                    if days_left < 20:
                        # Crisis: 3 Prelims Full Mock Daily
                        strategies.append(("Test", "Prelims Full Mock #1", 2.0))
                        strategies.append(("Test", "Prelims Full Mock #2", 2.0))
                        strategies.append(("Test", "Prelims Full Mock #3", 2.0))
                        
                    elif days_left < 40:
                        strategies.append(("Test", "Prelims Full Mock (Daily)", 2.0))
                        
                    elif days_left < 120:
                        strategies.append(("Test", "Prelims Full Mock (3-4 per week)", 1.5))
                        
                    else:
                        strategies.append(("Test", "Prelims Full Mock (1-2 per week)", 1.0))
                
                else:  # exam_stage == 'Mains'
                    # After Prelims - Only Mains mocks
                    if days_left < 20:
                        strategies.append(("Test", "Mains Full Mock #1", 2.5))
                        strategies.append(("Test", "Mains Full Mock #2", 2.5))
                    elif days_left < 40:
                        strategies.append(("Test", "Mains Full Mock (Daily)", 2.5))
                    else:
                        strategies.append(("Test", "Mains Full Mock (2-3 per week)", 2.0))
        
        # ============================================
        # REPEATER STRATEGY
        # ============================================
        else:
            # MOCK STRATEGY - Progressive for both Pre and Mains
            
            if exam_stage == 'Prelims':
                # Before Prelims Exam
                
                if days_left < 30:
                    # Critical Phase: Only Prelims Mocks (2-3 daily)
                    strategies.append(("Revision", "Rapid Fire Formulas", 1.0))
                    strategies.append(("Test", "Prelims Full Mock #1", 2.0))
                    strategies.append(("Test", "Prelims Full Mock #2", 2.0))
                    strategies.append(("Test", "Prelims Full Mock #3 (Optional)", 1.5))
                    strategies.append(("Practice", "Error Analysis", 1.0))
                    
                elif days_left < 60:
                    # Near Phase: Daily Full Mock (Both Pre + Mains)
                    strategies.append(("Revision", "Chapter-wise Revision", 1.0))
                    strategies.append(("Practice", "High-Difficulty Questions", 1.5))
                    strategies.append(("Test", "Prelims Full Mock (Daily)", 2.0))
                    strategies.append(("Test", "Mains Full Mock", 2.5))  # 1 per day
                    
                elif days_left < 120:
                    # Moderate Phase: 2 Pre + 1 Mains per week
                    strategies.append(("Revision", "Topic-wise Revision", 1.0))
                    strategies.append(("Practice", "Previous Year Questions", 1.5))
                    strategies.append(("Test", "Prelims Full Mock (2 per week)", 1.0))
                    strategies.append(("Test", "Mains Full Mock (1 per week)", 1.0))
                    
                else:
                    # Far Phase: 2 Pre + 1 Mains per week
                    strategies.append(("Revision", "Concept Revision", 1.5))
                    strategies.append(("Practice", "Advanced Practice", 1.5))
                    strategies.append(("Test", "Prelims Full Mock (2 per week)", 1.0))
                    strategies.append(("Test", "Mains Full Mock (1 per week)", 1.0))
            
            else:  # exam_stage == 'Mains'
                # After Prelims - Only Mains Mocks
                if days_left < 30:
                    strategies.append(("Revision", "Mains Topics Rapid Revision", 1.5))
                    strategies.append(("Test", "Mains Full Mock #1", 2.5))
                    strategies.append(("Test", "Mains Full Mock #2", 2.5))
                    strategies.append(("Practice", "Answer Writing Practice", 1.5))
                    
                elif days_left < 60:
                    strategies.append(("Revision", "Mains Syllabus Revision", 1.5))
                    strategies.append(("Test", "Mains Full Mock (Daily)", 2.5))
                    strategies.append(("Practice", "Descriptive Practice", 1.5))
                    
                else:
                    strategies.append(("Revision", "Mains Topics Deep Dive", 2.0))
                    strategies.append(("Test", "Mains Full Mock (2-3 per week)", 2.0))
                    strategies.append(("Practice", "Essay Writing", 1.0))
        
        return strategies

    def generate_task(self, subject, level, exam_stage, days_left, user_type='repeater', syllabus_percent=0, daily_hours=6, topic_progress=None, completion_history=None, topic_completion_history=None):
        """
        Generate tasks with proper coaching logic + Topic Filtering + Subject Priority + Sequential Progress
        MAX 10 TASKS LIMIT ENFORCED + PERFORMANCE-BASED ADAPTATION + SPACED REPETITION (3/7/21)
        
        topic_progress: dict {"Math": 15, "English": 8} - last completed topic ID per subject
        completion_history: dict {"Math": 0.75, "English": 0.50} - completion rates for adaptive learning
        topic_completion_history: dict {"Algebra": "2024-01-10"} - topic completion dates for spaced repetition
        """
        strategies = self.get_strategy(subject, level, exam_stage, days_left, syllabus_percent, user_type, daily_hours)
        if not strategies:
            return []
        
        # FEATURE #1: Add spaced repetition review tasks (3/7/21 day reviews)
        if topic_completion_history:
            spaced_tasks = self.get_spaced_repetition_tasks(topic_completion_history, subject)
            if spaced_tasks:
                # Prepend review tasks (high priority)
                strategies = spaced_tasks + strategies
                print(f"[SPACED] Added {len(spaced_tasks)} review tasks for {subject}")
        
        # FEATURE #2: Get performance-based adjustments (initialize here)
        performance_multiplier = 1.0
        if completion_history and subject in completion_history:
            adjustments = self.get_performance_adjustment({subject: completion_history[subject]})
            if subject in adjustments:
                performance_multiplier = adjustments[subject]['task_multiplier']
                print(f"[PERFORMANCE] {subject}: Applying {performance_multiplier}x task adjustment")

        generated_tasks = []
        subject_topics = self.kb[self.kb['Subject'] == subject] if subject in self.kb['Subject'].values else pd.DataFrame()
        
        # CRITICAL FIX: Filter Mains topics for beginners
        if user_type == 'beginner' and syllabus_percent < 80:
            # Exclude topics containing "Mains Level" or "mains level"
            if not subject_topics.empty:
                subject_topics = subject_topics[
                    ~subject_topics['Topic'].str.contains('mains level', case=False, na=False) &
                    ~subject_topics['SubTopic'].str.contains('mains level', case=False, na=False)
                ]
                print(f"[FILTER] Removed Mains topics for beginner ({syllabus_percent}%). Remaining: {len(subject_topics)}")
        
        # SEQUENTIAL PROGRESS: Filter topics based on last completed ID
        if topic_progress and subject in topic_progress:
            last_id = topic_progress[subject]
            if not subject_topics.empty and 'ID' in subject_topics.columns:
                # Get topics AFTER the last completed one
                subject_topics = subject_topics[subject_topics['ID'] > last_id]
                print(f"[PROGRESS] {subject}: Filtered to topics after ID {last_id}. Remaining: {len(subject_topics)}")
        
        # PRIORITY LOGIC: Time multiplier based on proficiency
        # Weak = 1.5x time, Average = 1.0x time, Strong = 0.7x time
        time_multiplier = 1.0  # Default
        if level == 'weak':
            time_multiplier = 1.5  # 50% MORE time for weak subjects
            print(f"[PRIORITY] Weak subject {subject}: 1.5x time allocation")
        elif level == 'strong':
            time_multiplier = 0.7  # 30% LESS time for strong subjects
            print(f"[PRIORITY] Strong subject {subject}: 0.7x time (maintenance mode)")
        else:
            print(f"[PRIORITY] Average subject {subject}: 1.0x time (standard)")
        
        for strategy_type, strategy_desc, duration_hrs in strategies:
            # Apply time multiplier
            adjusted_duration = duration_hrs * time_multiplier
            
            # USER REQUIREMENT: Mock MAX 1 HOUR (safety cap)
            if strategy_type == "Test" and "Mock" in strategy_desc:
                adjusted_duration = min(adjusted_duration, 1.0)  # CAP at 1 hour MAX
            
            task_obj = {
                "subject": subject,
                "type": strategy_type,
                "task": strategy_desc,
                "duration": f"{adjusted_duration} Hrs",
                "priority": "high" if days_left < 30 else "normal",
                "strategy": f"{user_type.upper()} | {exam_stage} | {days_left}D"
            }
            
            # Add topic if available - SEQUENTIAL SELECTION (not random)
            if not subject_topics.empty and strategy_type in ["Learning", "Revision"]:
                # Use first available topic (sequential progression)
            # Add topic if available - SEQUENTIAL SELECTION (not random)
            # EXCLUDE daily habits: Editorial Reading and Speed Calculation
             is_daily_habit = ("Editorial Reading" in strategy_desc or "Speed Calculation" in strategy_desc)
                
            if not subject_topics.empty and strategy_type in ["Learning", "Revision"] and not is_daily_habit:
                # Use first available topic (sequential progression)
                topic_row = subject_topics.iloc[0]
                task_obj["topic"] = str(topic_row.get('Topic', '')).replace('nan', '')
                task_obj["sub_topic"] = str(topic_row.get('SubTopic', '')).replace('nan', '')
                task_obj["task"] = f"{strategy_desc}: {task_obj['topic']} - {task_obj['sub_topic']}"
            
            
            generated_tasks.append(task_obj)
        
        # ============================================
        # PERFORMANCE-BASED TASK COUNT ADJUSTMENT
        # ============================================
        if completion_history and subject in completion_history and performance_multiplier != 1.0:
            target_count = int(len(generated_tasks) * performance_multiplier)
            if target_count < len(generated_tasks):
                # Reduce tasks for struggling students
                generated_tasks = generated_tasks[:target_count]
                print(f"[ADAPT] Reduced from {len(generated_tasks)} to {target_count} tasks due to performance")
        
        # ============================================
        # TASK LIMIT CONTROL: MAX 10 TASKS
        # ============================================
        MAX_TASKS_LIMIT = 10
        if len(generated_tasks) > MAX_TASKS_LIMIT:
            print(f"⚠️ [LIMIT] Generated {len(generated_tasks)} tasks, reducing to {MAX_TASKS_LIMIT}")
            
            # Smart Reduction Strategy:
            # 1. Keep all high-priority tasks
            # 2. Keep daily habits (Editorial, Calculation)
            # 3. Reduce optional/lower-priority tasks
            
            priority_tasks = []
            optional_tasks = []
            
            for task in generated_tasks:
                # Keep high priority and daily habits
                if task['priority'] == 'high' or 'Editorial' in task['task'] or 'Calculation Drill' in task['task']:
                    priority_tasks.append(task)
                else:
                    optional_tasks.append(task)
            
            # Calculate how many optional tasks we can keep
            remaining_slots = MAX_TASKS_LIMIT - len(priority_tasks)
            
            if remaining_slots > 0:
                # Keep the most important optional tasks
                generated_tasks = priority_tasks + optional_tasks[:remaining_slots]
            else:
                # If even priority tasks exceed limit, keep first 10
                generated_tasks = priority_tasks[:MAX_TASKS_LIMIT]
            
            print(f"✅ [LIMIT] Reduced to {len(generated_tasks)} tasks (Priority: {len(priority_tasks)}, Optional: {min(remaining_slots, len(optional_tasks))})")
        
        return generated_tasks
