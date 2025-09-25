import { useEffect, useState } from 'react';

const Matching = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (!token || !userId) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    fetch(`https://learningsphere-1fgj.onrender.com/api/matching/${userId}?status=pending`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setMatches(Array.isArray(data) ? data : data.matches || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Fetch matches error:', err);
        setError('Failed to load matches');
        setLoading(false);
      });
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Matches</h1>
      {loading ? (
        <p>Loading matches...</p>
      ) : error ? (
        <p className="text-red-500">Error: {error}</p>
      ) : matches.length === 0 ? (
        <p>No matches found</p>
      ) : (
        <ul className="space-y-4">
          {matches.map((match) => (
            <li key={match._id} className="border p-4 rounded">
              <h3 className="font-bold">{match.tutor?.profile?.name || 'Unknown Tutor'}</h3>
              <p>Score: {match.matchScore || 'N/A'}</p>
              <p>Status: {match.status}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Matching;
