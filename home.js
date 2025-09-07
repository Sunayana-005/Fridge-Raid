// Recipe Database (a small, in-memory collection)
        const recipes = [
            {
                name: "Simple Tomato Pasta",
                ingredients: ["pasta", "tomatoes", "garlic", "onion", "olive oil"],
                instructions: "Cook pasta. Sauté chopped garlic and onion in olive oil. Add diced tomatoes and simmer. Mix with pasta."
            },
            {
                name: "Chicken Stir-fry",
                ingredients: ["chicken", "rice", "broccoli", "soy sauce", "ginger"],
                instructions: "Cook rice. Stir-fry chicken and broccoli. Add soy sauce and grated ginger. Serve over rice."
            },
            {
                name: "Scrambled Eggs on Toast",
                ingredients: ["eggs", "bread", "butter", "milk", "salt", "pepper"],
                instructions: "Whisk eggs with a splash of milk, salt, and pepper. Scramble in a pan with butter. Serve on toasted bread."
            },
            {
                name: "Quick Quesadillas",
                ingredients: ["tortillas", "cheese", "chicken", "salsa"],
                instructions: "Place a tortilla in a pan. Layer with cheese, shredded chicken, and salsa. Top with another tortilla and cook until golden on both sides."
            },
            {
                name: "Tuna Salad Sandwich",
                ingredients: ["tuna", "mayonnaise", "bread", "lettuce", "onion"],
                instructions: "Mix tuna, mayonnaise, and finely chopped onion. Spread on bread and top with lettuce."
            }
        ];
// Global state and element references
        let userIngredients = [];
        const ingredientInput = document.getElementById('ingredient-input');
        const addIngredientBtn = document.getElementById('add-ingredient-btn');
        const ingredientList = document.getElementById('ingredient-list');
        const findRecipesBtn = document.getElementById('find-recipes-btn');
        const recipeResults = document.getElementById('recipe-results');

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
        const removeIngredient = (ingredientToRemove) => {
            userIngredients = userIngredients.filter(ing => ing !== ingredientToRemove);
            renderIngredients();
        };

        // Function to find and display recipes
        const findRecipes = () => {
            recipeResults.innerHTML = '';
            if (userIngredients.length === 0) {
                recipeResults.innerHTML = `<p class="text-center text-gray-500 italic">Add some ingredients to get started!</p>`;
                return;
            }

            const scoredRecipes = recipes.map(recipe => {
                const intersection = recipe.ingredients.filter(ing => userIngredients.includes(ing)).length;
                return { ...recipe, score: intersection };
            });

            const filteredRecipes = scoredRecipes
                .filter(recipe => recipe.score > 0)
                .sort((a, b) => b.score - a.score);

            if (filteredRecipes.length === 0) {
                recipeResults.innerHTML = `
                    <div class="text-center p-8 bg-orange-50 rounded-xl">
                        <p class="text-gray-600">No recipes found with your ingredients. Try adding some common items!</p>
                    </div>
                `;
                return;
            }
            filteredRecipes.forEach(recipe => {
                const recipeCard = document.createElement('div');
                recipeCard.className = 'bg-gray-50 p-6 rounded-xl shadow-sm border border-gray-200 space-y-4';
                recipeCard.innerHTML = `
                    <h3 class="text-xl font-bold text-gray-900">${recipe.name}</h3>
                    <div class="flex flex-wrap gap-2">
                        ${recipe.ingredients.map(ing => {
                            const isMatch = userIngredients.includes(ing);
                            return `<span class="px-3 py-1 rounded-full text-xs font-semibold ${isMatch ? 'bg-indigo-200 text-indigo-800' : 'bg-gray-200 text-gray-700'}">
                                ${ing}
                            </span>`;
                        }).join('')}
                    </div>
                    <p class="text-gray-600">${recipe.instructions}</p>
                    <div class="flex justify-end gap-2">
                        <button onclick="upvoteRecipe(this)" class="px-3 py-1 rounded-full text-sm bg-gray-200 hover:bg-green-200 transition-colors duration-200">👍 Upvote</button>
                        <button onclick="downvoteRecipe(this)" class="px-3 py-1 rounded-full text-sm bg-gray-200 hover:bg-red-200 transition-colors duration-200">👎 Downvote</button>
                    </div>
                `;
                recipeResults.appendChild(recipeCard);
            });
        };

        const upvoteRecipe = (btn) => {
            btn.closest('div').classList.add('opacity-75', 'border-green-500', 'border-2');
            console.log('Recipe upvoted!');
        };

        const downvoteRecipe = (btn) => {
            btn.closest('div').classList.add('opacity-75', 'border-red-500', 'border-2');
            console.log('Recipe downvoted!');
        };
        addIngredientBtn.addEventListener('click', addIngredient);
        findRecipesBtn.addEventListener('click', findRecipes);