function DealComparisonPage() {
  return (
    <div className="page">
      <section className="section">
        <h2>Selected deals</h2>
        <div className="grid">
          <div className="card">
            <div className="row-title">Deal A</div>
            <p className="muted">Price, calories, portion, expiration, value score</p>
          </div>
          <div className="card">
            <div className="row-title">Deal B</div>
            <p className="muted">Price, calories, portion, expiration, value score</p>
          </div>
          <div className="card">
            <div className="row-title">Deal C (optional)</div>
            <p className="muted">Add/remove selection.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Comparison rubric</h2>
        <div className="card">
          <div className="list">
            <div className="list-row">
              <div>
                <div className="row-title">Value score</div>
                <div className="row-meta">Higher is better</div>
              </div>
            </div>
            <div className="list-row">
              <div>
                <div className="row-title">Price</div>
                <div className="row-meta">Lower is better</div>
              </div>
            </div>
            <div className="list-row">
              <div>
                <div className="row-title">Expiration</div>
                <div className="row-meta">Sooner might be more urgent</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default DealComparisonPage
