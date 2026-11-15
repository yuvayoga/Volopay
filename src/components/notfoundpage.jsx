import { Link } from 'react-router-dom';

export default function NotFoundPage({ message = 'The page you are looking for does not exist.' }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-4">
      <div className="text-3xl font-bold text-slate-400 mb-2">404</div>
      <h1 className="text-lg font-bold mb-1">Not Found</h1>
      <p className="text-xs text-slate-500 mb-4">{message}</p>
      <Link to="/applications" className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded">
        &larr; Back to Applications
      </Link>
    </div>
  );
}
