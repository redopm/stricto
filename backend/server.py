from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import os
import datetime
from brain_engine import StrictoBrain

app = Flask(__name__)
CORS(app)

# --- GLOBAL BRAIN STATE ---
BRAIN = None
TASK_DB = None

def init_brain():
    global BRAIN, TASK_DB
    
    print("[INIT] Loading Knowledge Base...")
    
    # 1. Load User Syllabus Files (topics_*.csv)
    project_root = os.path.dirname(os.path.abspath(__file__)) # currently in backend/
    parent_dir = os.path.join(project_root, "..")
    
    subjects = {
        "math": "Math",
        "english": "English",
        "reasoning": "Reasoning",
        "ga": "GA"
    }
    
    all_topics = []
    
    for filename_key, subject_name in subjects.items():
        csv_path = os.path.join(parent_dir, f"topics_{filename_key}.csv")
        if os.path.exists(csv_path):
            try:
                # Read user CSV
                df = pd.read_csv(csv_path)
                for _, row in df.iterrows():
                    all_topics.append({
                        "Subject": subject_name,
                        "Topic": row.get('topic', 'Unknown'),
                        "SubTopic": row.get('sub-topic', ''),
                        "ID": row.get('id', '')
                    })
                print(f"[INFO] Loaded {len(df)} topics for {subject_name}")
            except Exception as e:
                print(f"[WARN] Failed to load {csv_path}: {e}")
        else:
            print(f"[WARN] Syllabus file missing: {csv_path}")

    # Convert to DataFrame
    TASK_DB = pd.DataFrame(all_topics)
    
    if TASK_DB.empty:
        print("[CRITICAL] No syllabus found! Brain will be empty.")
    
    # 2. Initialize Logic Engine
    print("[AI] Initializing Stricto Brain Engine v2.0...")
    BRAIN = StrictoBrain(TASK_DB)
    print("[AI] Brain Online.")

# Auto-init on start
init_brain()


# --- API ENDPOINTS ---

@app.route('/get-daily-task', methods=['POST'])
def get_task():
    global BRAIN
    
    user_req = request.json
    subject_raw = user_req.get('subject', 'English')
    if subject_raw.upper() == 'GA':
        subject = 'GA'
    else:
        subject = subject_raw.title()
        
    level = user_req.get('level', 'weak').lower() # Interpreted as Proficiency Logic
    exam_stage = user_req.get('examStage', 'Prelims') 
    user_date_str = user_req.get('examDate', 'other')
    
    # --- DATE CALCULATION (Robust Banking Logic) ---
    if not user_date_str or user_date_str.lower() == 'other' or user_date_str == '':
        # Default to Banking Season Start (June 15th of current/next year)
        today = datetime.date.today()
        target_year = today.year
        if today.month > 6: 
            target_year += 1 # Next season
        
        exam_date = datetime.date(target_year, 6, 15)
        system_note = "Auto-Target: Banking Season (June " + str(target_year) + ")"
    else:
        try:
            # Try ISO Format first YYYY-MM-DD
            exam_date = datetime.datetime.strptime(user_date_str, '%Y-%m-%d').date()
            system_note = f"Target: {user_date_str}"
        except ValueError:
            try:
                # Try Indian Format DD-MM-YYYY
                exam_date = datetime.datetime.strptime(user_date_str, '%d-%m-%Y').date()
                system_note = f"Target: {user_date_str}"
            except ValueError:
                # Fallback
                exam_date = datetime.date.today() + datetime.timedelta(days=150)
                system_note = "Invalid Date. Defaulting to 5 Months."

    days_left = (exam_date - datetime.date.today()).days

    # --- BEGINNER SYLLABUS ESTIMATION ---
    if level == 'beginner' and days_left > 140:
        system_note += " | Est. Syllabus Completion: 5 Months (Steady Pace)"
    elif level == 'beginner' and days_left < 90:
        system_note += " | ⚠️ Warning: Short Timeline for Beginner!"
    if days_left < 20 and exam_stage == 'Prelims':
        system_note = "CRITICAL MODE: Exam in < 20 days. New topics stopped. Revision & Mocks Only."

    user_type = user_req.get('userType', 'repeater').lower() # 'beginner' or 'repeater'
    syllabus_percent = int(user_req.get('syllabusCompleted', 0))
    daily_hours = int(user_req.get('dailyHours', 6)) # Default 6 hours
    topic_progress = user_req.get('topicProgress', {}) # {Math: 15, English: 8}

    print(f"[API] Request: Subject={subject}, Level={level}, Stage={exam_stage}, Days={days_left}, UserType={user_type}, Syll={syllabus_percent}%, Hours={daily_hours}, Progress={topic_progress}")

    try:
        if BRAIN:
            # Generate Tasks using Rule Engine
            generated_tasks = BRAIN.generate_task(subject, level, exam_stage, days_left, user_type, syllabus_percent, daily_hours, topic_progress)
            
            print(f"[API] Generated {len(generated_tasks)} tasks for {subject}")

            # Fallback if empty (e.g. Brain decided to SKIP but we need to return something to not break UI?)
            # Actually dashboard handles empty logic? 
            # If generated_tasks is empty (e.g. GA + Urgent + Prelims), we should probably return a note.
            
            if not generated_tasks and subject == 'GA' and exam_stage == 'Prelims':
                return jsonify({
                    "tasks": [{
                        "subject": "GA", 
                        "topic": "Focus on Core Subjects", 
                        "task": "Skipped per Strategy (Prelims/Urgent)", 
                        "duration": "0 Min", 
                        "impact": "Strategy", 
                        "strategy": "SKIP"
                    }],
                    "note": f"AI Plan: GA skipped to prioritize Math/Eng/Reas for Prelims."
                })
            
            elif not generated_tasks:
                 # Generic Fallback
                 print(f"[API] Fallback triggered for {subject}")
                 generated_tasks.append({
                        "subject": subject,
                        "topic": "General Revision",
                        "task": f"Review {subject} Notes",
                        "duration": "1.0 Hrs",
                        "impact": "Fallback",
                        "strategy": "Fallback"
                    })

            return jsonify({
                "tasks": generated_tasks,
                "note": f"AI Plan ({days_left} days left): " + system_note
            })
            
        else:
            return jsonify({"error": "Brain not initialized."})

    except Exception as e:
        print(f"[ERROR] Inference failed: {e}")
        return jsonify({"error": str(e)})

if __name__ == '__main__':
    print("[INFO] Stricto ML Server Running on Port 5000...")
    app.run(debug=True, port=5000)
