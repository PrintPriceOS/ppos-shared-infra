import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

const Layout = ({ children }: { children: React.ReactNode }) => (
    <div className="layout">
        <nav>
            <Link to="/">Overview</Link>
            <Link to="/runs">Runs</Link>
            <Link to="/repos">Repos</Link>
            <Link to="/stories">Stories</Link>
            <Link to="/gates">Gates</Link>
            <Link to="/evidence">Evidence</Link>
            <Link to="/blockers">Blockers</Link>
            <Link to="/operations">Operations</Link>
            <Link to="/reports">Reports</Link>
        </nav>
        <main>{children}</main>
    </div>
);

export default function App() {
    return (
        <Router>
            <Layout>
                <Routes>
                    <Route path="/" element={<div>Overview Page</div>} />
                    <Route path="/runs" element={<div>Runs Page</div>} />
                    <Route path="/repos" element={<div>Repos Page</div>} />
                    <Route path="/stories" element={<div>Stories Page</div>} />
                    <Route path="/gates" element={<div>Gates Page</div>} />
                    <Route path="/evidence" element={<div>Evidence Page</div>} />
                    <Route path="/blockers" element={<div>Blockers Page</div>} />
                    <Route path="/operations" element={<div>Operations Page</div>} />
                    <Route path="/reports" element={<div>Reports Page</div>} />
                </Routes>
            </Layout>
        </Router>
    );
}
