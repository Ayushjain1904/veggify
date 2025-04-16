import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

function Bookmarks() {
    const [bookmarks, setBookmarks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchBookmarks(user.uid);
            } else {
                setBookmarks([]);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const fetchBookmarks = async (userId) => {
        try {
            const bookmarksRef = collection(db, 'bookmarks');
            const q = query(bookmarksRef, where('userId', '==', userId));
            const querySnapshot = await getDocs(q);
            
            const bookmarksData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            setBookmarks(bookmarksData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching bookmarks:', error);
            setLoading(false);
        }
    };

    const removeBookmark = async (bookmarkId) => {
        try {
            await deleteDoc(doc(db, 'bookmarks', bookmarkId));
            setBookmarks(bookmarks.filter(bookmark => bookmark.id !== bookmarkId));
        } catch (error) {
            console.error('Error removing bookmark:', error);
        }
    };

    if (loading) {
        return (
            <div className="pt-[30vh] flex justify-center">
                <div className="text-xl">Loading bookmarks...</div>
            </div>
        );
    }

    return (
        <div className="pt-[10vh] px-4">
            <h1 className="text-4xl font-semibold mb-8 text-center">Your Bookmarked Recipes</h1>
            {bookmarks.length === 0 ? (
                <div className="text-center text-xl text-gray-600">
                    No bookmarked recipes yet. Start saving your favorite recipes!
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bookmarks.map((bookmark) => (
                        <div key={bookmark.id} className="border rounded-lg p-4 shadow-lg">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-xl font-semibold">{bookmark.title}</h2>
                                <button
                                    onClick={() => removeBookmark(bookmark.id)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    Remove
                                </button>
                            </div>
                            <div className="prose" dangerouslySetInnerHTML={{ __html: bookmark.content }} />
                            <div className="mt-4 text-sm text-gray-500">
                                <p>Cuisine: {bookmark.cuisine}</p>
                                <p>Cooking Time: {bookmark.cookingTime}</p>
                                <p>Complexity: {bookmark.complexity}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Bookmarks;