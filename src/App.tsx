import { useRef, useState } from 'react';
import { Loader2, ImagePlus, Salad, BarChart3 } from 'lucide-react';

interface Meal {
  id: string;
  image: string;
  calories: number;
  createdAt: string;
}

function getRandomCalories() {
  // Simulate AI calorie detection
  return Math.floor(Math.random() * 600) + 200;
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const LOCAL_KEY = 'ai-meal-tracker-meals';
const DAILY_GOAL = 2000;

function getTodayDateString() {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

function getWeekDates() {
  const now = new Date();
  const week: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    week.push(d.toISOString().slice(0, 10));
  }
  return week;
}

export default function App() {
  const [meals, setMeals] = useState<Meal[]>(() => {
    const stored = localStorage.getItem(LOCAL_KEY);
    return stored ? JSON.parse(stored) : [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // --- Calorie summary logic ---
  const today = getTodayDateString();
  const weekDates = getWeekDates();
  const todayMeals = meals.filter(m => m.createdAt.slice(0, 10) === today);
  const todayCalories = todayMeals.reduce((sum, m) => sum + m.calories, 0);
  const weekCalories = weekDates.map(date =>
    meals.filter(m => m.createdAt.slice(0, 10) === date).reduce((sum, m) => sum + m.calories, 0)
  );
  const weekTotal = weekCalories.reduce((a, b) => a + b, 0);

  function saveMeals(newMeals: Meal[]) {
    setMeals(newMeals);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(newMeals));
  }

  async function handleFile(file: File) {
    setError(null);
    setLoading(true);
    try {
      // Read file as data URL
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      // Simulate AI analysis delay
      await new Promise((r) => setTimeout(r, 1800));
      // Simulate AI calorie detection
      const calories = getRandomCalories();
      const meal: Meal = {
        id: Date.now().toString(),
        image: dataUrl,
        calories,
        createdAt: new Date().toISOString(),
      };
      const newMeals = [meal, ...meals];
      saveMeals(newMeals);
    } catch (e) {
      setError('Failed to process image. Try another photo.');
    } finally {
      setLoading(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so same file can be uploaded again
    e.target.value = '';
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (loading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  function triggerFileInput() {
    if (!loading) fileInput.current?.click();
  }

  function clearMeals() {
    saveMeals([]);
  }

  // --- UI ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-orange-50 flex flex-col items-center py-10 px-2 font-sans">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-extrabold text-green-700 flex items-center gap-2 mb-2">
          <Salad className="w-8 h-8 text-orange-400" />
          AI Meal Tracker
        </h1>
        <p className="text-gray-500 mb-6">Snap or upload your meal, and let AI estimate the calories. Stay healthy, the fun way!</p>

        {/* Calorie Summary Section */}
        <div className="mb-8">
          <div className="rounded-2xl bg-white/80 shadow p-5 flex flex-col gap-4 border border-green-100 animate-fade-in">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-5 h-5 text-orange-400" />
              <span className="text-lg font-bold text-green-700">Today’s Calories</span>
              <span className="ml-auto text-sm text-gray-400">Goal: {DAILY_GOAL} kcal</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-extrabold text-orange-500 drop-shadow-sm">{todayCalories}</span>
              <span className="text-base text-gray-400">kcal</span>
              <div className="flex-1 ml-2">
                <div className="w-full h-3 bg-green-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-green-400 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (todayCalories / DAILY_GOAL) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-green-700">This Week</span>
                <span className="ml-auto text-xs text-gray-400">Total: {weekTotal} kcal</span>
              </div>
              {/* Simple bar chart */}
              <div className="flex items-end gap-1 h-16 w-full">
                {weekCalories.map((cal, i) => {
                  const max = Math.max(...weekCalories, 1);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-5 rounded-t-lg bg-gradient-to-t from-green-200 to-orange-400 shadow-sm transition-all duration-700"
                        style={{ height: `${(cal / max) * 56 + 8}px`, minHeight: 8 }}
                        title={`${cal} kcal`}
                      />
                      <span className="text-[10px] text-gray-400 mt-1">
                        {new Date(weekDates[i]).toLocaleDateString(undefined, { weekday: 'short' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div
          className={`rounded-2xl border-2 border-dashed ${loading ? 'border-orange-300 bg-orange-50' : 'border-green-200 bg-white hover:bg-green-50'} transition-colors flex flex-col items-center justify-center py-10 cursor-pointer relative group`}
          onClick={triggerFileInput}
          onDrop={onDrop}
          onDragOver={onDragOver}
          tabIndex={0}
          aria-label="Upload meal photo"
        >
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
            disabled={loading}
          />
          {loading ? (
            <div className="flex flex-col items-center gap-2 animate-pulse">
              <Loader2 className="w-10 h-10 text-orange-400 animate-spin" />
              <span className="text-orange-500 font-semibold">Analyzing meal...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImagePlus className="w-10 h-10 text-green-400 group-hover:scale-110 transition-transform" />
              <span className="text-green-700 font-medium">Click or drag a meal photo here</span>
            </div>
          )}
        </div>
        {error && <div className="mt-3 text-red-500 text-sm text-center">{error}</div>}
        <div className="flex justify-between items-center mt-8 mb-2">
          <h2 className="text-xl font-bold text-green-700">Today’s Meals</h2>
          {meals.length > 0 && (
            <button
              className="text-xs text-orange-500 hover:underline px-2 py-1 rounded"
              onClick={clearMeals}
              disabled={loading}
            >
              Clear All
            </button>
          )}
        </div>
        <div className="space-y-4">
          {meals.length === 0 && (
            <div className="text-gray-400 text-center py-10 flex flex-col items-center">
              <Salad className="w-8 h-8 mb-2 text-green-200" />
              <span>No meals tracked yet. Upload your first meal!</span>
            </div>
          )}
          {meals.map((meal) => (
            <div
              key={meal.id}
              className="flex items-center gap-4 bg-white rounded-xl shadow-sm p-3 border border-green-100 hover:shadow-md transition-shadow"
            >
              <img
                src={meal.image}
                alt="Meal"
                className="w-16 h-16 object-cover rounded-lg border border-green-100 shadow-sm"
                loading="lazy"
              />
              <div className="flex-1">
                <div className="text-lg font-semibold text-green-700">{meal.calories} kcal</div>
                <div className="text-xs text-gray-400">{formatTime(meal.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <footer className="mt-10 text-xs text-gray-400">Made with AI · Stay healthy!</footer>
    </div>
  );
}
