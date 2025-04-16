import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

function GoalTracking() {
    const [goals, setGoals] = useState([]);
    const [newGoal, setNewGoal] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchGoals(user.uid);
            } else {
                setGoals([]);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const fetchGoals = async (userId) => {
        try {
            const goalsRef = collection(db, 'goals');
            const q = query(goalsRef, where('userId', '==', userId));
            const querySnapshot = await getDocs(q);
            
            const goalsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            setGoals(goalsData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching goals:', error);
            setLoading(false);
        }
    };

    const addGoal = async (e) => {
        e.preventDefault();
        if (!newGoal.trim()) return;

        try {
            const user = auth.currentUser;
            if (!user) return;

            const docRef = await addDoc(collection(db, 'goals'), {
                title: newGoal.trim(),
                completed: false,
                userId: user.uid,
                createdAt: new Date(),
                progress: 0
            });

            setGoals([...goals, { id: docRef.id, title: newGoal.trim(), completed: false, progress: 0 }]);
            setNewGoal('');
        } catch (error) {
            console.error('Error adding goal:', error);
        }
    };

    const updateGoalProgress = async (goalId, progress) => {
        try {
            await updateDoc(doc(db, 'goals', goalId), {
                progress: progress,
                completed: progress >= 100
            });

            setGoals(goals.map(goal => 
                goal.id === goalId ? { ...goal, progress, completed: progress >= 100 } : goal
            ));
        } catch (error) {
            console.error('Error updating goal:', error);
        }
    };

    const removeGoal = async (goalId) => {
        try {
            await deleteDoc(doc(db, 'goals', goalId));
            setGoals(goals.filter(goal => goal.id !== goalId));
        } catch (error) {
            console.error('Error removing goal:', error);
        }
    };

    if (loading) {
        return (
            <div className="pt-[30vh] flex justify-center">
                <div className="text-xl">Loading goals...</div>
            </div>
        );
    }

    return (
        <div className="pt-[10vh] px-4 max-w-2xl mx-auto">
            <h1 className="text-4xl font-semibold mb-8 text-center">Goal Tracking</h1>
            
            <form onSubmit={addGoal} className="mb-8">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newGoal}
                        onChange={(e) => setNewGoal(e.target.value)}
                        placeholder="Add new goal..."
                        className="flex-1 p-2 border rounded"
                    />
                    <button
                        type="submit"
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Add
                    </button>
                </div>
            </form>

            <div className="space-y-4">
                {goals.map((goal) => (
                    <div
                        key={goal.id}
                        className="border rounded-lg p-4"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-semibold">{goal.title}</h3>
                            <button
                                onClick={() => removeGoal(goal.id)}
                                className="text-red-500 hover:text-red-700"
                            >
                                Remove
                            </button>
                        </div>
                        
                        <div className="mt-2">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Progress</span>
                                <span>{goal.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                    className="bg-blue-600 h-2.5 rounded-full"
                                    style={{ width: `${goal.progress}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={() => updateGoalProgress(goal.id, Math.max(0, goal.progress - 10))}
                                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                            >
                                -10%
                            </button>
                            <button
                                onClick={() => updateGoalProgress(goal.id, Math.min(100, goal.progress + 10))}
                                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                            >
                                +10%
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default GoalTracking;