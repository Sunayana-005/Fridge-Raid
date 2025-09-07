import json
import sqlite3
from flask import Flask, request, jsonify
from flask_cors import CORS
from fuzzywuzzy import fuzz

def load_recipes_from_json(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)

recipes = load_recipes_from_json("food_items.json")

def fuzzy_match(user_ingredients, recipe_ingredients):
    score = 0
    for ui in user_ingredients:
        for ri in recipe_ingredients:
            if fuzz.partial_ratio(ui, ri) > 80:
                score += 1
                break
    return score

app = Flask(
    __name__,
    static_folder=".",
    static_url_path="/static"
)
CORS(app)

def init_db():
    conn = sqlite3.connect("votes.db")
    c = conn.cursor()
    c.execute("""
      CREATE TABLE IF NOT EXISTS votes (
        recipe_name TEXT PRIMARY KEY,
        up_votes INTEGER NOT NULL DEFAULT 0,
        down_votes INTEGER NOT NULL DEFAULT 0
      )
    """)
    conn.commit()
    conn.close()

def get_votes(recipe_name: str) -> dict:
    conn = sqlite3.connect("votes.db")
    c = conn.cursor()
    c.execute("SELECT up_votes, down_votes FROM votes WHERE recipe_name = ?", (recipe_name,))
    row = c.fetchone()
    conn.close()
    if row:
        return {"up_votes": row[0], "down_votes": row[1]}
    return {"up_votes": 0, "down_votes": 0}

def record_vote(recipe_name: str, vote_type: str) -> dict:
    conn = sqlite3.connect("votes.db")
    c = conn.cursor()
    c.execute("""
        INSERT OR IGNORE INTO votes(recipe_name, up_votes, down_votes)
        VALUES (?, 0, 0);
    """, (recipe_name,))
    if vote_type == "up":
        c.execute("UPDATE votes SET up_votes = up_votes + 1 WHERE recipe_name = ?", (recipe_name,))
    else:
        c.execute("UPDATE votes SET down_votes = down_votes + 1 WHERE recipe_name = ?", (recipe_name,))
    conn.commit()
    c.execute("SELECT up_votes, down_votes FROM votes WHERE recipe_name = ?", (recipe_name,))
    up, down = c.fetchone()
    conn.close()
    return {"up_votes": up, "down_votes": down}

@app.route("/recommend", methods=["POST"])
def recommend():
    data = request.get_json() or {}
    user_ingredients = [i.lower() for i in data.get("ingredients", [])]
    diet_filter       = data.get("diet", "").lower()
    meal_type_filter  = data.get("mealType", "")

    filtered = []
    for recipe in recipes:
        recipe_ingredients = [i.lower() for i in recipe.get("ingredients", [])]
        if diet_filter and diet_filter not in recipe.get("diet", "").lower():
            continue
        if meal_type_filter and recipe.get("mealType") != meal_type_filter:
            continue

        match_count = fuzzy_match(user_ingredients, recipe_ingredients)
        if match_count > 0:
            filtered.append({
                "name":         recipe.get("name"),
                "score":        match_count,
                "ingredients":  recipe.get("ingredients"),
                "instructions": recipe.get("instructions"),
                "diet":         recipe.get("diet"),
                "mealType":     recipe.get("mealType"),
                "image":        recipe.get("image")
            })

    filtered.sort(key=lambda x: -x["score"])
    return jsonify(filtered)

@app.route("/vote", methods=["POST"])
def vote():
    data = request.get_json() or {}
    name  = data.get("recipe_name")
    vtype = data.get("vote_type")

    if vtype not in ("up", "down") or not name:
        return jsonify({"error": "Invalid payload"}), 400

    counts = record_vote(name, vtype)
    return jsonify({"recipe_name": name, **counts})

@app.route("/", methods=["GET"])
def serve_home():
    return app.send_static_file("home.html")

if __name__ == "__main__":
    init_db()
    app.run(host="127.0.0.1", port=8000, debug=True)