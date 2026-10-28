import { AnimatePresence, motion } from 'framer-motion';
import { BASE_CURRENCY, rateLabel } from '../../utils/format';

// Glass toast shown site-wide while prices switch currency or pick up a new live rate.
export default function CurrencyNotice({ notice }) {
  return (
    <div className="cur-notice-wrap" aria-live="polite">
      <AnimatePresence>
        {notice && (
          <motion.div
            className={`cur-notice ${notice.phase}`}
            initial={{ opacity: 0, y: -16, scale: 0.96, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -12, scale: 0.97, filter: 'blur(6px)' }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            role="status"
          >
            <span className="cur-notice-icon" aria-hidden="true">
              {notice.phase === 'loading'
                ? <span className="cur-spinner" />
                : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>}
            </span>
            <span>
              <b>
                {notice.phase === 'loading'
                  ? (notice.codeChanged ? `Converting prices to ${notice.code}…` : 'Applying the latest exchange rate…')
                  : (notice.codeChanged ? `Prices now shown in ${notice.code}` : 'Prices updated to the live rate')}
              </b>
              <small>{notice.code === BASE_CURRENCY ? 'Original prices in INR' : `${rateLabel(notice.code, notice.rate)} · ECB reference rate`}</small>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
