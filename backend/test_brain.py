import pandas as pd
from brain_engine import StrictoBrain
import os

# Mock DB
class MockDB:
    def __init__(self):
        self.data = {
            "Subject": ["GA", "GA", "Math", "English", "Reasoning"],
            "Topic": ["Current Affairs", "Static GK", "Algebra", "Grammar", "Puzzles"],
            "SubTopic": ["Daily News", "Dams", "Basics", "Nouns", "Seating"],
            "ID": [1, 2, 3, 4, 5]
        }
    def __getitem__(self, item):
        return pd.DataFrame(self.data)

def run_tests():
    print("--- TESTING BRAIN LOGIC ---")
    
    # Init Brain with Mock Data
    df = pd.DataFrame({
        "Subject": ["GA", "GA", "Math", "English", "Reasoning"],
        "Topic": ["Current Affairs", "Static GK", "Algebra", "Grammar", "Puzzles"],
        "SubTopic": ["Daily News", "Dams", "Basics", "Nouns", "Seating"],
        "ID": [1, 2, 3, 4, 5]
    })
    brain = StrictoBrain(df)
    
    # TEST 1: GA in Prelims + Urgent (Should be SKIP)
    # Days < 20
    strategies = brain.get_strategy("GA", "weak", "Prelims", 15)
    print(f"Test 1 (GA, Prelims, Urgent): {strategies} -> {'PASS' if not strategies else 'FAIL'}")

    # TEST 2: GA in Prelims + Far (Should be Static GK)
    # Days > 150
    strategies = brain.get_strategy("GA", "weak", "Prelims", 200)
    print(f"Test 2 (GA, Prelims, Far): {strategies}")
    has_static = any("Static" in s[1] for s in strategies)
    print(f"-> {'PASS' if has_static else 'FAIL'}")

    # TEST 3: GA in Mains (Should be Daily CA)
    strategies = brain.get_strategy("GA", "weak", "Mains", 45)
    print(f"Test 3 (GA, Mains): {strategies}")
    has_daily = any("Daily News" in s[1] for s in strategies)
    print(f"-> {'PASS' if has_daily else 'FAIL'}")

    # TEST 4: Math Urgent (Should be Mock/Revision, No Foundation)
    strategies = brain.get_strategy("Math", "weak", "Prelims", 10)
    print(f"Test 4 (Math, Urgent): {strategies}")
    check = all(s[0] in ["Test", "Revision"] for s in strategies)
    print(f"-> {'PASS' if check else 'FAIL'}")
    
    print("--- END TESTS ---")

if __name__ == "__main__":
    run_tests()
