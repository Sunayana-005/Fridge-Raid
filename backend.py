from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from fuzzywuzzy import fuzz
import json
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

def load_recipes_from_json(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)

recipes = load_recipes_from_json("food_items.json")

class RecipeRequest(BaseModel):
    ingredients: list
    diet: str = ""
    mealType: str = ""

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="."), name="static")

def fuzzy_match(user_ingredients, recipe_ingredients):
    score = 0
    for ui in user_ingredients:
        for ri in recipe_ingredients:
            if fuzz.partial_ratio(ui, ri) > 80:
                score += 1
                break
    return score

@app.post("/recommend")
async def recommend(data: RecipeRequest):
    user_ingredients = [i.lower() for i in data.ingredients]
    filtered = []
    for recipe in recipes:
        recipe_ingredients = [i.lower() for i in recipe["ingredients"]]
        if data.diet and recipe["diet"] != data.diet:
            continue
        if data.mealType and recipe["mealType"] != data.mealType:
            continue
        match_count = fuzzy_match(user_ingredients, recipe_ingredients)
        if match_count > 0:  # Only show recipes with at least one match
            filtered.append({
                "name": recipe["name"],
                "score": match_count,
                "ingredients": recipe["ingredients"],
                "instructions": recipe["instructions"],
                "diet": recipe["diet"],
                "mealType": recipe["mealType"],
                "image": recipe["image"]
            })
    filtered.sort(key=lambda x: -x["score"])
    return filtered

@app.get("/", response_class=FileResponse)
async def serve_home():
    return FileResponse("home.html")

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)