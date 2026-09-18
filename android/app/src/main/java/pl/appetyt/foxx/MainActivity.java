package pl.appetyt.foxx;

import android.app.Activity;
import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Spinner;
import android.widget.ArrayAdapter;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public class MainActivity extends Activity {
    private static final int BG = Color.rgb(250, 247, 242);
    private static final int INK = Color.rgb( forty(), 35, 29);
    private static final int MUTED = Color.rgb(112, 99, 88);
    private static final int ORANGE = Color.rgb(232, 93, 53);
    private static final int CARD = Color.WHITE;

    private final List<Recipe> recipes = new ArrayList<>();
    private LinearLayout root;
    private EditText search;
    private Spinner category;
    private TextView count;

    private static int forty() {
        return 40;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(23, 19, 15));
        getWindow().setNavigationBarColor(Color.rgb(23, 19, 15));
        loadRecipes();
        showList();
    }

    private void loadRecipes() {
        try (InputStream input = getAssets().open("recipes.json")) {
            BufferedReader reader = new BufferedReader(new InputStreamReader(input, StandardCharsets.UTF_8));
            StringBuilder json = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                json.append(line);
            }
            JSONArray items = new JSONArray(json.toString());
            for (int i = 0; i < items.length(); i++) {
                recipes.add(Recipe.fromJson(items.getJSONObject(i)));
            }
            Collections.sort(recipes, Comparator.comparing(recipe -> recipe.title.toLowerCase()));
        } catch (Exception error) {
            Toast.makeText(this, "Nie udało się wczytać przepisów", Toast.LENGTH_LONG).show();
        }
    }

    private void showList() {
        root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(BG);
        setContentView(root);

        LinearLayout header = new LinearLayout(this);
        header.setOrientation(LinearLayout.VERTICAL);
        header.setPadding(dp(20), dp(22), dp(20), dp(12));
        header.setBackgroundColor(Color.rgb(23, 19, 15));
        root.addView(header, new LinearLayout.LayoutParams(-1, -2));

        TextView eyebrow = text("FOXX GOTUJE", 12, Color.rgb(255, 190, 153), false);
        eyebrow.setLetterSpacing(0.12f);
        header.addView(eyebrow);
        TextView title = text("Co dziś gotujemy?", 28, Color.WHITE, true);
        title.setPadding(0, dp(4), 0, dp(14));
        header.addView(title);

        search = new EditText(this);
        search.setSingleLine(true);
        search.setHint("Szukaj przepisu...");
        search.setTextSize(16);
        search.setTextColor(INK);
        search.setHintTextColor(MUTED);
        search.setPadding(dp(14), 0, dp(14), 0);
        search.setBackground(roundRect(Color.WHITE, 12));
        header.addView(search, new LinearLayout.LayoutParams(-1, dp(50)));

        LinearLayout filters = new LinearLayout(this);
        filters.setGravity(Gravity.CENTER_VERTICAL);
        filters.setPadding(dp(20), dp(12), dp(20), dp(4));
        root.addView(filters, new LinearLayout.LayoutParams(-1, -2));

        category = new Spinner(this);
        List<String> categories = new ArrayList<>();
        categories.add("Wszystkie kategorie");
        Set<String> unique = new LinkedHashSet<>();
        for (Recipe recipe : recipes) {
            if (!recipe.category.isEmpty()) unique.add(recipe.category);
        }
        categories.addAll(unique);
        ArrayAdapter<String> adapter = new ArrayAdapter<String>(this, android.R.layout.simple_spinner_dropdown_item, categories) {
            @Override
            public View getView(int position, View convertView, android.view.ViewGroup parent) {
                TextView view = (TextView) super.getView(position, convertView, parent);
                view.setTextSize(14);
                view.setTextColor(INK);
                view.setPadding(0, 0, dp(8), 0);
                return view;
            }
        };
        category.setAdapter(adapter);
        filters.addView(category, new LinearLayout.LayoutParams(0, dp(44), 1));

        count = text("", 13, MUTED, false);
        count.setGravity(Gravity.CENTER_VERTICAL | Gravity.RIGHT);
        filters.addView(count, new LinearLayout.LayoutParams(dp(100), dp(44)));

        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        LinearLayout list = new LinearLayout(this);
        list.setOrientation(LinearLayout.VERTICAL);
        list.setPadding(dp(20), dp(8), dp(20), dp(24));
        scroll.addView(list, new ScrollView.LayoutParams(-1, -2));
        root.addView(scroll, new LinearLayout.LayoutParams(-1, 0, 1));

        View.OnClickListener ignored = view -> renderCards(list);
        search.setOnEditorActionListener((v, actionId, event) -> {
            renderCards(list);
            return false;
        });
        search.addTextChangedListener(new SimpleTextWatcher() {
            @Override
            public void afterTextChanged(android.text.Editable editable) {
                renderCards(list);
            }
        });
        category.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(android.widget.AdapterView<?> parent, View view, int position, long id) {
                renderCards(list);
            }

            @Override
            public void onNothingSelected(android.widget.AdapterView<?> parent) {
            }
        });
        renderCards(list);
    }

    private void renderCards(LinearLayout list) {
        if (list == null) return;
        list.removeAllViews();
        String query = search == null ? "" : search.getText().toString().trim().toLowerCase();
        String selectedCategory = category == null || category.getSelectedItem() == null
                ? "Wszystkie kategorie" : category.getSelectedItem().toString();
        int visible = 0;
        for (Recipe recipe : recipes) {
            boolean matchesQuery = query.isEmpty()
                    || recipe.title.toLowerCase().contains(query)
                    || recipe.category.toLowerCase().contains(query)
                    || recipe.ingredientNames().toLowerCase().contains(query);
            boolean matchesCategory = selectedCategory.equals("Wszystkie kategorie")
                    || selectedCategory.equals(recipe.category);
            if (!matchesQuery || !matchesCategory) continue;
            list.addView(recipeCard(recipe), new LinearLayout.LayoutParams(-1, -2));
            visible++;
        }
        count.setText(visible + " przepisów");
        if (visible == 0) {
            TextView empty = text("Nie znaleziono przepisu. Spróbuj innej frazy.", 16, MUTED, false);
            empty.setPadding(0, dp(28), 0, 0);
            list.addView(empty);
        }
    }

    private View recipeCard(Recipe recipe) {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setPadding(dp(16), dp(15), dp(16), dp(15));
        card.setBackground(roundRect(CARD, 16));
        card.setElevation(dp(2));
        card.setOnClickListener(view -> showDetail(recipe));

        TextView categoryText = text(recipe.category.toUpperCase(), 11, ORANGE, true);
        categoryText.setLetterSpacing(0.08f);
        card.addView(categoryText);
        TextView title = text(recipe.title, 19, INK, true);
        title.setPadding(0, dp(5), 0, dp(9));
        card.addView(title);
        TextView meta = text(recipe.meta(), 13, MUTED, false);
        card.addView(meta);
        TextView nutrition = text(recipe.nutrition(), 13, MUTED, false);
        nutrition.setPadding(0, dp(7), 0, 0);
        card.addView(nutrition);

        LinearLayout.LayoutParams spacing = new LinearLayout.LayoutParams(-1, dp(12));
        spacing.topMargin = dp(12);
        card.setLayoutParams(spacing);
        return card;
    }

    private void showDetail(Recipe recipe) {
        LinearLayout outer = new LinearLayout(this);
        outer.setOrientation(LinearLayout.VERTICAL);
        outer.setBackgroundColor(BG);

        LinearLayout toolbar = new LinearLayout(this);
        toolbar.setGravity(Gravity.CENTER_VERTICAL);
        toolbar.setPadding(dp(10), dp(10), dp(16), dp(10));
        toolbar.setBackgroundColor(Color.rgb(23, 19, 15));
        TextView back = text("‹", 36, Color.WHITE, false);
        back.setGravity(Gravity.CENTER);
        back.setOnClickListener(view -> showList());
        toolbar.addView(back, new LinearLayout.LayoutParams(dp(44), dp(48)));
        TextView toolbarTitle = text("Appetyt Foxx", 16, Color.WHITE, true);
        toolbar.addView(toolbarTitle, new LinearLayout.LayoutParams(0, -2, 1));
        outer.addView(toolbar, new LinearLayout.LayoutParams(-1, -2));

        ScrollView scroll = new ScrollView(this);
        LinearLayout body = new LinearLayout(this);
        body.setOrientation(LinearLayout.VERTICAL);
        body.setPadding(dp(20), dp(22), dp(20), dp(30));
        scroll.addView(body, new ScrollView.LayoutParams(-1, -2));
        outer.addView(scroll, new LinearLayout.LayoutParams(-1, 0, 1));
        setContentView(outer);

        TextView eyebrow = text(recipe.category.toUpperCase(), 12, ORANGE, true);
        eyebrow.setLetterSpacing(0.08f);
        body.addView(eyebrow);
        TextView title = text(recipe.title, 28, INK, true);
        title.setPadding(0, dp(5), 0, dp(10));
        body.addView(title);
        body.addView(text(recipe.meta(), 14, MUTED, false));
        body.addView(text(recipe.nutrition(), 14, MUTED, false), marginParams(0, 6, 0, 18));

        sectionTitle(body, "Składniki");
        for (Ingredient ingredient : recipe.ingredients) {
            LinearLayout row = new LinearLayout(this);
            row.setGravity(Gravity.CENTER_VERTICAL);
            row.setPadding(dp(13), dp(10), dp(13), dp(10));
            row.setBackground(roundRect(Color.WHITE, 10));
            TextView amount = text(ingredient.amount, 14, ORANGE, true);
            amount.setGravity(Gravity.RIGHT | Gravity.CENTER_VERTICAL);
            row.addView(amount, new LinearLayout.LayoutParams(dp(105), -2));
            TextView name = text(ingredient.name, 15, INK, false);
            name.setPadding(dp(10), 0, 0, 0);
            row.addView(name, new LinearLayout.LayoutParams(0, -2, 1));
            LinearLayout.LayoutParams rowParams = new LinearLayout.LayoutParams(-1, -2);
            rowParams.bottomMargin = dp(6);
            body.addView(row, rowParams);
        }

        sectionTitle(body, "Przygotowanie");
        List<String> steps = recipe.sourceSteps.isEmpty() ? recipe.steps : recipe.sourceSteps;
        for (int i = 0; i < steps.size(); i++) {
            LinearLayout row = new LinearLayout(this);
            row.setGravity(Gravity.TOP);
            TextView number = text(String.valueOf(i + 1), 16, Color.WHITE, true);
            number.setGravity(Gravity.CENTER);
            number.setBackground(roundRect(ORANGE, 22));
            row.addView(number, new LinearLayout.LayoutParams(dp(34), dp(34)));
            TextView instruction = text(steps.get(i), 16, INK, false);
            instruction.setPadding(dp(12), dp(2), 0, 0);
            row.addView(instruction, new LinearLayout.LayoutParams(0, -2, 1));
            LinearLayout.LayoutParams rowParams = new LinearLayout.LayoutParams(-1, -2);
            rowParams.bottomMargin = dp(15);
            body.addView(row, rowParams);
        }

        TextView footer = text("Dane: Foxx Gotuje · 64 przepisów w katalogu", 12, MUTED, false);
        footer.setPadding(0, dp(12), 0, 0);
        body.addView(footer);
    }

    private void sectionTitle(LinearLayout parent, String label) {
        TextView heading = text(label, 21, INK, true);
        parent.addView(heading, marginParams(0, 18, 0, 10));
    }

    private TextView text(String value, float size, int color, boolean bold) {
        TextView view = new TextView(this);
        view.setText(value);
        view.setTextSize(size);
        view.setTextColor(color);
        view.setTypeface(bold ? Typeface.DEFAULT_BOLD : Typeface.DEFAULT);
        view.setIncludeFontPadding(true);
        return view;
    }

    private LinearLayout.LayoutParams marginParams(int left, int top, int right, int bottom) {
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(-1, -2);
        params.setMargins(dp(left), dp(top), dp(right), dp(bottom));
        return params;
    }

    private GradientDrawable roundRect(int color, int radius) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(color);
        drawable.setCornerRadius(dp(radius));
        return drawable;
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private static String number(double value) {
        if (Math.abs(value - Math.round(value)) < 0.01) return String.valueOf(Math.round(value));
        return String.format(java.util.Locale.US, "%.1f", value);
    }

    private static class Recipe {
        String title = "";
        String category = "Dania";
        int duration;
        int servings;
        double calories;
        double protein;
        double fat;
        double carbs;
        List<Ingredient> ingredients = new ArrayList<>();
        List<String> steps = new ArrayList<>();
        List<String> sourceSteps = new ArrayList<>();

        static Recipe fromJson(JSONObject object) throws Exception {
            Recipe recipe = new Recipe();
            recipe.title = object.optString("title", "Bez tytułu");
            recipe.category = object.optString("category", "Dania");
            recipe.duration = object.optInt("duration_minutes", 0);
            recipe.servings = object.optInt("servings", 1);
            recipe.calories = object.optDouble("calories_per_serving", 0);
            recipe.protein = object.optDouble("protein_per_serving", 0);
            recipe.fat = object.optDouble("fat_per_serving", 0);
            recipe.carbs = object.optDouble("carbs_per_serving", 0);
            JSONArray ingredients = object.optJSONArray("ingredients");
            if (ingredients != null) {
                for (int i = 0; i < ingredients.length(); i++) {
                    JSONObject item = ingredients.getJSONObject(i);
                    recipe.ingredients.add(new Ingredient(
                            item.optString("amount_text", "").trim(),
                            item.optString("name", "składnik").trim()));
                }
            }
            JSONArray operationalSteps = object.optJSONArray("steps");
            if (operationalSteps != null) {
                for (int i = 0; i < operationalSteps.length(); i++) {
                    recipe.steps.add(operationalSteps.getJSONObject(i).optString("instructions", ""));
                }
            }
            JSONArray originalSteps = object.optJSONArray("source_steps");
            if (originalSteps != null) {
                for (int i = 0; i < originalSteps.length(); i++) {
                    recipe.sourceSteps.add(originalSteps.optString(i, ""));
                }
            }
            return recipe;
        }

        String meta() {
            return duration + " min  ·  " + servings + " porcji  ·  " + ingredients.size() + " składników";
        }

        String nutrition() {
            return number(calories) + " kcal / porcję  ·  B " + number(protein) + " g  ·  T "
                    + number(fat) + " g  ·  W " + number(carbs) + " g";
        }

        String ingredientNames() {
            StringBuilder value = new StringBuilder();
            for (Ingredient ingredient : ingredients) value.append(' ').append(ingredient.name);
            return value.toString();
        }
    }

    private static class Ingredient {
        final String amount;
        final String name;

        Ingredient(String amount, String name) {
            this.amount = amount.isEmpty() ? "—" : amount;
            this.name = name;
        }
    }

    private abstract static class SimpleTextWatcher implements android.text.TextWatcher {
        @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
        @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
    }
}
