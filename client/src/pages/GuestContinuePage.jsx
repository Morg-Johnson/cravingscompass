import { Link } from 'react-router-dom'

function GuestContinuePage() {
  return (
    <div className="page">
      <header className="page-header">
        <h1>Continue as Guest</h1>
        <p className="page-subtitle">Browse deals without creating an account.</p>
      </header>

      <section className="section">
        <h2>What you get</h2>
        <div className="card">
          <div className="list">
            <div className="list-row">
              <div>
                <div className="row-title">Browse + compare deals</div>
                <div className="row-meta">No sign-up required</div>
              </div>
            </div>
            <div className="list-row">
              <div>
                <div className="row-title">Limited personalization</div>
                <div className="row-meta">Saved items won’t sync across devices</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Next</h2>
        <div className="card actions">
          <Link className="btn btn--primary" to="/search">
            Start browsing
          </Link>
          <Link className="btn" to="/login">
            Create an account
          </Link>
        </div>
      </section>
    </div>
  )
}

export default GuestContinuePage
