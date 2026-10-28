import { Link } from 'react-router-dom';
import { Logo } from './Navbar';
import { useStore } from '../../context/StoreContext';
import { BASE_CURRENCY, getCurrency, rateLabel } from '../../utils/format';
import { RATES_SOURCE } from '../../utils/rates';

// Tells visitors where converted prices come from and how fresh the rate is.
function RateNote() {
  const { live, settings } = useStore();
  const { code, rate } = getCurrency();
  if (code === BASE_CURRENCY) return <span className="rate-note">Prices shown in INR, as listed.</span>;
  const isLive = settings.autoRates !== false && live?.base === BASE_CURRENCY && live.rates?.[code];
  return (
    <span className="rate-note">
      Prices listed in INR, shown in {code} at {rateLabel(code, rate)}
      {isLive
        ? <> · <a href={RATES_SOURCE.url} target="_blank" rel="noreferrer">ECB reference rate via Frankfurter</a>, {new Date(live.rateDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</>
        : ' · rate set by BASK Reality'}
    </span>
  );
}

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Logo />
            <p style={{ marginTop: 16, maxWidth: 320 }}>
              BASK Reality helps you find, buy, sell and rent homes with local agents and clear tools.
            </p>
          </div>
          <div>
            <h4>Explore</h4>
            <ul>
              <li><Link to="/buy">Homes for sale</Link></li>
              <li><Link to="/rent">Rentals</Link></li>
              <li><Link to="/sell">Sell your home</Link></li>
              <li><Link to="/mortgage">Mortgage calculator</Link></li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li><Link to="/about">About us</Link></li>
              <li><Link to="/agents">Our agents</Link></li>
              <li><Link to="/blog">Guides</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4>Get in touch</h4>
            <ul>
              <li>hello@baskreality.com</li>
              <li>(800) 555-0199</li>
              <li>Mon–Sat, 8am–8pm</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} BASK Reality. All rights reserved.</span>
          <RateNote />
          <span><Link to="/privacy">Privacy</Link> · <Link to="/terms">Terms</Link></span>
        </div>
      </div>
    </footer>
  );
}
