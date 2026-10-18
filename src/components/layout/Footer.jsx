import { Link } from 'react-router-dom';
import { Logo } from './Navbar';

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
          <span><Link to="/privacy">Privacy</Link> · <Link to="/terms">Terms</Link></span>
        </div>
      </div>
    </footer>
  );
}
