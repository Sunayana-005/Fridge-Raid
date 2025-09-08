const URL = "https://fridge-raid.onrender.com"      //chnage this as needed

let userIngredients = [];
const ingredientInput = document.getElementById('ingredient-input');
const addIngredientBtn = document.getElementById('add-ingredient-btn');
const ingredientList = document.getElementById('ingredient-list');
const findRecipesBtn = document.getElementById('find-recipes-btn');
const recipeResults = document.getElementById('recipe-results');
const dietSelect = document.getElementById('diet-select');
const mealTypeSelect = document.getElementById('meal-type-select');

// Modal elements
const modal = document.getElementById('recipe-modal');
const modalContent = document.getElementById('modal-content');
const modalClose = document.getElementById('modal-close');

// Favorites and votes from localStorage
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
let votes = JSON.parse(localStorage.getItem('votes') || '{}');

// Function to render the ingredient list
const renderIngredients = () => {
    ingredientList.innerHTML = userIngredients.map(ing => `
        <li class="bg-indigo-100 text-indigo-800 font-medium px-3 py-1 rounded-full flex items-center gap-1">
            <span>${ing}</span>
            <button onclick="removeIngredient('${ing}')" class="text-indigo-600 hover:text-indigo-800 transition-colors duration-200">&times;</button>
        </li>
    `).join('');
};

// Function to add an ingredient
const addIngredient = () => {
    const ingredient = ingredientInput.value.trim().toLowerCase();
    if (ingredient && !userIngredients.includes(ingredient)) {
        userIngredients.push(ingredient);
        ingredientInput.value = '';
        renderIngredients();
    }
};

// Function to remove an ingredient
window.removeIngredient = (ingredientToRemove) => {
    userIngredients = userIngredients.filter(ing => ing !== ingredientToRemove);
    renderIngredients();
};

// Function to save favorites
const saveFavorites = () => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
};

// Function to save votes
const saveVotes = () => {
    localStorage.setItem('votes', JSON.stringify(votes));
};

// Function to show modal
window.showRecipeModal = (recipeIdx) => {
    const recipe = window.lastRecipes[recipeIdx];
    modalContent.innerHTML = `
        <div class="space-y-4">
            <img src="${recipe.image}" alt="${recipe.name}" class="w-full h-48 object-cover rounded-xl mb-2">
            <h2 class="text-2xl font-bold">${recipe.name}</h2>
            <div class="flex flex-wrap gap-2 mb-2">
                ${recipe.ingredients.map(ing => `<span class="px-3 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">${ing}</span>`).join('')}
            </div>
            <p class="text-gray-700">${recipe.instructions}</p>
            <div class="mt-4">
                <button onclick="addToShoppingList(${recipeIdx})" class="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700">Add Ingredients to Shopping List</button>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
};

// Function to close modal
modalClose.onclick = () => {
    modal.classList.add('hidden');
};

// Function to add ingredients to shopping list
window.addToShoppingList = (recipeIdx) => {
    const recipe = window.lastRecipes[recipeIdx];
    const missing = recipe.ingredients.filter(ing => !userIngredients.includes(ing));
    if (missing.length === 0) {
        alert("You already have all ingredients!");
    } else {
        alert("Added to shopping list:\n" + missing.join(", "));
    }
    modal.classList.add('hidden');
};

// Function to find and display recipes (fetches from backend)
const findRecipes = () => {
    recipeResults.innerHTML = '';
    if (userIngredients.length === 0) {
        recipeResults.innerHTML = `<p class="text-center text-gray-500 italic">Add some ingredients to get started!</p>`;
        return;
    }

    const selectedDiet = dietSelect.value;
    const selectedMealType = mealTypeSelect.value;

    fetch(`${URL}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            ingredients: userIngredients,
            diet: selectedDiet,
            mealType: selectedMealType
        })
    })
    .then(res => res.json())
    .then(recipes => {
        window.lastRecipes = recipes.map((r, idx) => ({...r, idx}));
        if (recipes.length === 0) {
            recipeResults.innerHTML = `
                <div class="text-center p-8 bg-orange-50 rounded-xl">
                    <p class="text-gray-600">No recipes found with your ingredients and options. Try changing your filters or adding some common items!</p>
                </div>
            `;
            return;
        }
        recipes.forEach((recipe, idx) => {
            const upvotes = votes[recipe.name]?.up || 0;
            const downvotes = votes[recipe.name]?.down || 0;
            const isFavorite = favorites.includes(recipe.name);
            const recipeCard = document.createElement('div');
            recipeCard.className = 'bg-gray-50 p-6 rounded-xl shadow-sm border border-gray-200 space-y-4';
            recipeCard.innerHTML = `
                <img src="${recipe.image}" alt="${recipe.name}" class="w-full h-40 object-cover rounded-xl mb-2">
                <h3 class="text-xl font-bold text-gray-900">${recipe.name}</h3>
                <div class="flex flex-wrap gap-2">
                    ${recipe.ingredients.map(ing => {
                        const isMatch = userIngredients.includes(ing);
                        return `<span class="px-3 py-1 rounded-full text-xs font-semibold ${isMatch ? 'bg-indigo-200 text-indigo-800' : 'bg-gray-200 text-gray-700'}">
                            ${ing}
                        </span>`;
                    }).join('')}
                </div>
                <div class="flex w-full gap-4 mt-2">
                    <button onclick="showRecipeModal(${idx})" class="w-1/2 px-6 py-3 rounded-xl text-base font-semibold bg-blue-200 hover:bg-blue-300 transition-colors duration-200">View Details</button>
                    <button onclick="toggleFavorite('${recipe.name}', this)" class="w-1/2 px-6 py-3 rounded-xl text-base ${isFavorite ? 'bg-yellow-300' : 'bg-gray-200'} hover:bg-yellow-200 transition-colors duration-200 font-semibold">${isFavorite ? '★' : '☆'} Favorite</button>
                </div>
                <p class="text-gray-600">${recipe.instructions}</p>
                <div class="flex justify-end gap-2 items-center">
                    <button onclick="upvoteRecipe('${recipe.name}', this)" class="px-3 py-1 rounded-full text-sm bg-gray-200 hover:bg-green-200 transition-colors duration-200">👍 Upvote (${upvotes})</button>
                    <button onclick="downvoteRecipe('${recipe.name}', this)" class="px-3 py-1 rounded-full text-sm bg-gray-200 hover:bg-red-200 transition-colors duration-200">👎 Downvote (${downvotes})</button>
                </div>
            `;
            recipeResults.appendChild(recipeCard);
        });
    })
    .catch(() => {
        recipeResults.innerHTML = `<div class="text-center p-8 bg-red-50 rounded-xl"><p class="text-red-600">Could not connect to backend. Make sure Python server is running.</p></div>`;
    });
};

const voteRecipeOnServer = async (recipeName, type) => {
  const payload = {
    recipe_name: recipeName,
    vote_type:    type
  };
  const res = await fetch(`${URL}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    throw new Error(`Server responded ${res.status} on voting`);
  }
  return res.json();
};


window.upvoteRecipe = async (name) => {
  try {
    const { up_votes, down_votes } = await voteRecipeOnServer(name, "up");
    votes[name] = {
      up:   up_votes,
      down: down_votes
    };
    saveVotes();
    findRecipes();
  } catch (err) {
    console.error(err);
  }
};

window.downvoteRecipe = async (name) => {
  try {
    const { up_votes, down_votes } = await voteRecipeOnServer(name, "down");
    votes[name] = {
      up:   up_votes,
      down: down_votes
    };
    saveVotes();
    findRecipes();
  } catch (err) {
    console.error(err);
  }
};

window.toggleFavorite = (recipeName, btn) => {
    if (favorites.includes(recipeName)) {
        favorites = favorites.filter(fav => fav !== recipeName);
    } else {
        favorites.push(recipeName);
    }
    saveFavorites();
    findRecipes();
};

addIngredientBtn.addEventListener('click', addIngredient);
findRecipesBtn.addEventListener('click', findRecipes);

window.onclick = function(event) {
    if (event.target == modal) {
        modal.classList.add('hidden');
    }
};