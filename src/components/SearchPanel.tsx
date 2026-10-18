'use client';

import { useState } from 'react';

export default function SearchPanel({ compact = false, defaultIntent = 'Buy', defaultLocation = '', defaultType = 'Any type', defaultPrice = 'Any price' }: { compact?: boolean; defaultIntent?: string; defaultLocation?: string; defaultType?: string; defaultPrice?: string }) {
  const [intent, setIntent] = useState(defaultIntent);
  return (
    <form className={compact ? 'search-panel search-panel-compact' : 'search-panel'} action="/list-layout-new">
      <div className="search-tabs" role="group" aria-label="Listing type">
        {['Buy', 'Rent'].map((value) => <button type="button" key={value} className={intent === value ? 'search-tab is-active' : 'search-tab'} onClick={() => setIntent(value)}>{value}</button>)}
        <input type="hidden" name="intent" value={intent} />
      </div>
      <div className="search-fields">
        <label className="search-location"><span>Where</span><input type="search" name="location" defaultValue={defaultLocation} placeholder="City, neighbourhood or postcode" /></label>
        <label><span>Property type</span><select name="type" defaultValue={defaultType}><option>Any type</option><option>Villa</option><option>House</option><option>Apartment</option><option>Townhouse</option></select></label>
        <label><span>Price range</span><select name="price" defaultValue={defaultPrice}><option>Any price</option><option>Under GH₵ 1m</option><option>GH₵ 1m – 2m</option><option>GH₵ 2m+</option></select></label>
        <button className="button button-primary search-submit" type="submit"><span aria-hidden="true">⌕</span> Search homes</button>
      </div>
      {!compact && <div className="search-extra"><label><input type="checkbox" name="beds" value="3" /> 3+ bedrooms</label><label><input type="checkbox" name="verified" value="true" /> Verified listings</label><a href="/list-layout-with-sidebar">More filters ↗</a></div>}
    </form>
  );
}
