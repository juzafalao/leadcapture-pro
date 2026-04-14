// RankingPage.jsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';

const RankingPage = () => {
    const [rankings, setRankings] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRankings = async () => {
            console.log('[DEBUG] Fetching rankings from API...');
            try {
                const response = await axios.get('/api/rankings');
                setRankings(response.data);
                console.log('[DEBUG] Rankings fetched successfully:', response.data);
            } catch (err) {
                console.error('[ERROR] Failed to fetch rankings:', err);
                setError('Failed to fetch rankings. Please try again later.');
            }
        };

        fetchRankings();
    }, []);

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <h1>Ranking Page</h1>
            <ul>
                {rankings.map((ranking) => (
                    <li key={ranking.id}>{ranking.name} - {ranking.score}</li>
                ))}
            </ul>
        </div>
    );
};

export default RankingPage;
