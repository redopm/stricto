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
        
    def get_strategy(self, subject, level, exam_stage, days_left, syllabus_percent=0, user_type='repeater', daily_hours=6):
        """
        Advanced Coaching Strategy with Spaced Repetition & Progressive Mocks
        """
        strategies = []
        
        # ============================================
        # DAILY HABITS (ALL STUDENTS) - DYNAMIC TIME
        # ============================================
        # Allocate time based on daily_hours: 5+ hrs = 40min/20min, <5 hrs = 30min/20min
        if daily_hours >= 5:
            editorial_time = 0.67  # 40 minutes
            calculation_time = 0.33  # 20 minutes
        else:
            editorial_time = 0.5  # 30 minutes (minimum)
            calculation_time = 0.33  # 20 minutes (minimum)
        
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
        # SPACED REPETITION LOGIC - TEMPORARILY DISABLED
        # ============================================
        # PROBLEM: Generic "3-Day Review" tasks are impossible without actual topic history!
        # A repeater who started TODAY has NOTHING to review from 3/7/21 days ago.
        # 
        # SOLUTION: Disabled until frontend implements topicHistory tracking.
        # When implemented, logic should be:
        # if topic_history and user_type == 'repeater':
        #     for each topic that needs review based on completion date:
        #         Add specific "3-Day Review: [Topic Name]" task
        # 
        # For now, repeaters will get Chapter-wise Revision (from repeater strategy below)
        # which is a valid alternative without needing specific history.
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
                    strategies.append(("Revision", "Concept Revision (3/7/21)", 1.5))
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

    def generate_task(self, subject, level, exam_stage, days_left, user_type='repeater', syllabus_percent=0, daily_hours=6, topic_progress=None):
        """
        Generate tasks with proper coaching logic + Topic Filtering + Subject Priority + Sequential Progress
        topic_progress: dict {"Math": 15, "English": 8} - last completed topic ID per subject
        """
        strategies = self.get_strategy(subject, level, exam_stage, days_left, syllabus_percent, user_type, daily_hours)
        if not strategies:
            return []

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
        
        return generated_tasks
