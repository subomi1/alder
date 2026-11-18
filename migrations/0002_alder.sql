-- Alder catalog, profiles, ratings, and reviews.
-- Applied once, after the auth schema. Idempotent inserts so a replay is safe.

create table if not exists categories (
  id serial primary key,
  slug text not null unique,
  name text not null,
  blurb text not null
);

create table if not exists products (
  id serial primary key,
  slug text not null unique,
  name text not null,
  brand text not null,
  category_id integer not null references categories (id),
  summary text not null,
  description text not null,
  price_cents integer not null check (price_cents >= 0 and price_cents <= 500000),
  image_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists profiles (
  user_id text primary key references "user" (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 60),
  bio text not null default '' check (char_length(bio) <= 280),
  role text not null default 'user' check (role in ('user', 'admin')),
  suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ratings (
  id serial primary key,
  product_id integer not null references products (id) on delete cascade,
  user_id text not null,
  score integer not null check (score between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create table if not exists reviews (
  id serial primary key,
  product_id integer not null references products (id) on delete cascade,
  user_id text not null,
  rating_id integer not null unique references ratings (id) on delete cascade,
  author_name text not null,
  title text not null check (char_length(title) between 4 and 100),
  body text not null check (char_length(body) between 20 and 2000),
  status text not null default 'published' check (status in ('published', 'hidden')),
  origin text not null default 'member' check (origin in ('member', 'house')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create index if not exists products_category_idx on products (category_id);
create index if not exists reviews_product_idx on reviews (product_id);
create index if not exists reviews_user_idx on reviews (user_id);
create index if not exists ratings_product_idx on ratings (product_id);

insert into categories (slug, name, blurb)
select v.slug, v.name, v.blurb
from (
  values
    ('listening', 'Listening', 'Headphones and radios tuned for real rooms.'),
    ('desk', 'Desk', 'Tools that stay on the table because they earn it.'),
    ('kitchen', 'Kitchen', 'Vessels and heat for unhurried cooking.'),
    ('light', 'Light', 'Lamps with a point of view.'),
    ('carry', 'Carry', 'Bags that survive a real week.'),
    ('care', 'Care', 'Small rituals and considered formulas.')
) as v(slug, name, blurb)
where not exists (select 1 from categories c where c.slug = v.slug);

insert into products (slug, name, brand, category_id, summary, description, price_cents, image_url)
select v.slug, v.name, v.brand, c.id, v.summary, v.description, v.price_cents::int, v.image_url
from (
  values
    (
      'harbor', 'Harbor', 'Atelier North', 'listening',
      'Closed-back headphones with a warm, quiet tuning.',
      'Harbor is built for long listening rather than spectacle. The clamp eases after a few minutes, the tuning sits slightly warm, and the closed back keeps a train carriage out without sealing the music in a cupboard. A typical price is what independent shops have been asking this season.',
      24800, '/products/harbor.jpg'
    ),
    (
      'ledger', 'Ledger No. 2', 'Paper & Pine', 'desk',
      'A lay-flat cloth notebook with paper that takes a pencil.',
      'Ledger No. 2 is 192 pages, short enough to finish. The binding lies open on a desk without a hand on the spine, and the paper accepts a pencil or a fine liner without feathering. The cloth cover looks better once it has been carried.',
      3200, '/products/ledger.jpg'
    ),
    (
      'kettle', 'Kettle No. 4', 'Hearth & Iron', 'kitchen',
      'A matte gooseneck kettle with a steady, slow pour.',
      'Kettle No. 4 is heavier than it looks, which is the point. The spout holds a thin stream for pour-over, the lid seats exactly, and the handle stays civil after a boil. The enamel has a soft matte that does not show every fingerprint.',
      16400, '/products/kettle.jpg'
    ),
    (
      'arc', 'Arc Task Lamp', 'Lumen Works', 'light',
      'A brass arm and a tight pool of dimmable light.',
      'Arc keeps light on the page and out of the rest of the room. It dims low enough for a late desk, the brass arm holds a position, and the pivot is firm on purpose. It is a lamp for one person, not a fixture for a whole table.',
      21000, '/products/arc.jpg'
    ),
    (
      'tote', 'Field Tote', 'Canvas & Co.', 'carry',
      'Eighteen litres of waxed canvas with straps that soften.',
      'Field Tote is sized for a laptop, a market run, and the book you meant to finish. Waxed canvas shrugs off a wet commute, the bag stands open on a chair, and the leather straps loosen after a fortnight of use. There is no gadget pocket. That is a choice.',
      12800, '/products/tote.jpg'
    ),
    (
      'balm', 'Cedar Balm', 'Grove Apothecary', 'care',
      'A short-scent cedar balm that does not coat the hands.',
      'Cedar Balm is for after washing up. The scent is brief, the texture sinks in, and a little covers both hands. The wooden lid is why it lives on the sink instead of in a drawer. It is not a perfume and it is not a medical claim.',
      2400, '/products/balm.jpg'
    ),
    (
      'slate', 'Slate 75', 'Keyroom', 'desk',
      'A dampened low-profile keyboard without the light show.',
      'Slate 75 keeps the arrows, drops the number pad, and refuses RGB theatre. The board is dampened so it does not ping in a quiet room. Keycaps are low, the case is a warm gray, and it is meant to disappear under your hands.',
      18900, '/products/slate.jpg'
    ),
    (
      'carafe', 'Glass Carafe', 'Stillwater', 'kitchen',
      'A 600 ml borosilicate server you can see the bloom through.',
      'The Glass Carafe holds two cups, which is a useful argument to stop. You can see the coffee, the wooden collar stays comfortable when the glass is hot, and there is no seam that traps grounds. It rinses clean in one pass.',
      5400, '/products/carafe.jpg'
    )
) as v(slug, name, brand, category_slug, summary, description, price_cents, image_url)
join categories c on c.slug = v.category_slug
where not exists (select 1 from products p where p.slug = v.slug);

-- House notes are editorial seed reviews, not member accounts.
insert into ratings (product_id, user_id, score, created_at)
select p.id, v.user_id, v.score::int, now() - (v.days::int * interval '1 day')
from (
  values
    ('harbor', 'house-mina', 5, 21),
    ('harbor', 'house-jonah', 4, 12),
    ('ledger', 'house-adaeze', 5, 30),
    ('ledger', 'house-samir', 5, 9),
    ('kettle', 'house-mina', 4, 16),
    ('kettle', 'house-jonah', 5, 6),
    ('arc', 'house-adaeze', 5, 25),
    ('arc', 'house-samir', 3, 4),
    ('tote', 'house-jonah', 5, 18),
    ('tote', 'house-mina', 4, 8),
    ('balm', 'house-samir', 4, 14),
    ('balm', 'house-adaeze', 4, 3),
    ('slate', 'house-mina', 5, 27),
    ('slate', 'house-jonah', 4, 11),
    ('carafe', 'house-adaeze', 5, 19),
    ('carafe', 'house-samir', 5, 2)
) as v(slug, user_id, score, days)
join products p on p.slug = v.slug
where not exists (
  select 1 from ratings r where r.product_id = p.id and r.user_id = v.user_id
);

insert into reviews (
  product_id, user_id, rating_id, author_name, title, body, origin, status, created_at
)
select p.id, v.user_id, r.id, v.author_name, v.title, v.body, 'house', 'published', r.created_at
from (
  values
    (
      'harbor', 'house-mina', 'Mina Okonkwo', 'Quiet on a late train',
      'The clamp eases off after a chapter. Voices stay natural, and the closed back keeps a carriage out without making music feel sealed in a cupboard.'
    ),
    (
      'harbor', 'house-jonah', 'Jonah Hale', 'Warm, not woolly',
      'Bass is present without blooming into the mids. I wish the case were slimmer, but this is the tuning I reach for after a day of calls.'
    ),
    (
      'ledger', 'house-adaeze', 'Adaeze Cole', 'Lay-flat, finally',
      'It stays open on a desk without a hand on the spine. The paper takes a pencil and a fine liner, and it does not feather at the edges.'
    ),
    (
      'ledger', 'house-samir', 'Samir Rahman', 'The notebook I finish',
      'One hundred ninety-two pages is short enough to complete. The cloth cover looks better once it is scuffed, which took about a week of a bag.'
    ),
    (
      'kettle', 'house-mina', 'Mina Okonkwo', 'A precise pour',
      'The gooseneck stays steady at a slow flow. It is heavier than it looks, which I wanted, and the lid fit is exact rather than rattly.'
    ),
    (
      'kettle', 'house-jonah', 'Jonah Hale', 'Heat without fuss',
      'It boils quickly and the handle stays civil. The matte enamel has not marked in a month of morning use, even on a gas hob.'
    ),
    (
      'arc', 'house-adaeze', 'Adaeze Cole', 'A small pool of light',
      'It dims low enough for a late desk without lighting the whole room. The brass arm holds its place once you commit to an angle.'
    ),
    (
      'arc', 'house-samir', 'Samir Rahman', 'Beautiful, slightly fussy',
      'The joint needs two hands the first week. Once it is set, the light is excellent. I docked a star for that stiff pivot, not for the beam.'
    ),
    (
      'tote', 'house-jonah', 'Jonah Hale', 'Groceries and a laptop',
      'Waxed canvas shrugs off a wet commute. The straps have started to soften, and eighteen litres turns out to be an honest number.'
    ),
    (
      'tote', 'house-mina', 'Mina Okonkwo', 'Structured, not stiff',
      'It stands open on a chair, which is the test I care about. I would have liked an interior pocket. It is still the bag I grab.'
    ),
    (
      'balm', 'house-samir', 'Samir Rahman', 'Cedar, then nothing',
      'The scent is brief. Hands feel repaired after washing dishes, not coated. The wooden lid is the reason it stays on the sink.'
    ),
    (
      'balm', 'house-adaeze', 'Adaeze Cole', 'A little goes a long way',
      'One pass covers both hands. There is no sting on a nick. I wanted a refill tin, which does not exist yet, so the jar has to last.'
    ),
    (
      'slate', 'house-mina', 'Mina Okonkwo', 'Quiet enough for a library',
      'Dampened, low, and the board does not ping. I type longer without the theatre of lights. It disappears, which is the compliment.'
    ),
    (
      'slate', 'house-jonah', 'Jonah Hale', 'A layout I can live on',
      'Seventy-five percent kept the arrows and lost the number pad I never used. The legends are discreet and the case does not creak.'
    ),
    (
      'carafe', 'house-adaeze', 'Adaeze Cole', 'Clear glass, clear coffee',
      'You can see the bloom as it happens. The wood collar is comfortable when the glass is hot. Six hundred millilitres is two cups, then stop.'
    ),
    (
      'carafe', 'house-samir', 'Samir Rahman', 'Washes in one rinse',
      'No trapped grounds around a seam. It looks like a piece of glassware rather than a gadget, and it does not hold yesterday smell.'
    )
) as v(slug, user_id, author_name, title, body)
join products p on p.slug = v.slug
join ratings r on r.product_id = p.id and r.user_id = v.user_id
where not exists (
  select 1 from reviews rv where rv.product_id = p.id and rv.user_id = v.user_id
);
