import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

function ShoppingList() {
    const [items, setItems] = useState([]);
    const [newItem, setNewItem] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchItems(user.uid);
            } else {
                setItems([]);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const fetchItems = async (userId) => {
        try {
            const itemsRef = collection(db, 'shoppingList');
            const q = query(itemsRef, where('userId', '==', userId));
            const querySnapshot = await getDocs(q);
            
            const itemsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            setItems(itemsData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching items:', error);
            setLoading(false);
        }
    };

    const addItem = async (e) => {
        e.preventDefault();
        if (!newItem.trim()) return;

        try {
            const user = auth.currentUser;
            if (!user) return;

            const docRef = await addDoc(collection(db, 'shoppingList'), {
                name: newItem.trim(),
                completed: false,
                userId: user.uid,
                createdAt: new Date()
            });

            setItems([...items, { id: docRef.id, name: newItem.trim(), completed: false }]);
            setNewItem('');
        } catch (error) {
            console.error('Error adding item:', error);
        }
    };

    const toggleItem = async (itemId) => {
        try {
            const item = items.find(item => item.id === itemId);
            if (!item) return;

            await updateDoc(doc(db, 'shoppingList', itemId), {
                completed: !item.completed
            });

            setItems(items.map(item => 
                item.id === itemId ? { ...item, completed: !item.completed } : item
            ));
        } catch (error) {
            console.error('Error toggling item:', error);
        }
    };

    const removeItem = async (itemId) => {
        try {
            await deleteDoc(doc(db, 'shoppingList', itemId));
            setItems(items.filter(item => item.id !== itemId));
        } catch (error) {
            console.error('Error removing item:', error);
        }
    };

    if (loading) {
        return (
            <div className="pt-[30vh] flex justify-center">
                <div className="text-xl">Loading shopping list...</div>
            </div>
        );
    }

    return (
        <div className="pt-[10vh] px-4 max-w-2xl mx-auto">
            <h1 className="text-4xl font-semibold mb-8 text-center">Shopping List</h1>
            
            <form onSubmit={addItem} className="mb-8">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        placeholder="Add new item..."
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

            <div className="space-y-2">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center justify-between p-3 border rounded"
                    >
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={item.completed}
                                onChange={() => toggleItem(item.id)}
                                className="h-5 w-5"
                            />
                            <span className={item.completed ? 'line-through text-gray-500' : ''}>
                                {item.name}
                            </span>
                        </div>
                        <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-500 hover:text-red-700"
                        >
                            Remove
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ShoppingList;