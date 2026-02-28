-- Seed subscription plans
INSERT INTO plans (code, name, price, currency, max_photos, max_videos, stripe_price_id) VALUES
  ('free', 'Free', 0, 'BRL', 3, 0, NULL),
  ('premium', 'Premium', 4900, 'BRL', 10, 2, NULL),
  ('black', 'Black', 9900, 'BRL', 30, 5, NULL);

-- Seed feature groups (using "fruits" as internal naming as specified)
INSERT INTO features (group_name, feature_name, display_order) VALUES
  -- General features
  ('FruitsGeneral', 'Maçã', 1),
  ('FruitsGeneral', 'Banana', 2),
  ('FruitsGeneral', 'Laranja', 3),
  ('FruitsGeneral', 'Uva', 4),
  ('FruitsGeneral', 'Morango', 5),
  ('FruitsGeneral', 'Abacaxi', 6),
  ('FruitsGeneral', 'Manga', 7),
  ('FruitsGeneral', 'Melancia', 8),
  
  -- Special features
  ('FruitsSpecial', 'Kiwi', 1),
  ('FruitsSpecial', 'Framboesa', 2),
  ('FruitsSpecial', 'Amora', 3),
  ('FruitsSpecial', 'Pitaya', 4),
  ('FruitsSpecial', 'Lichia', 5),
  ('FruitsSpecial', 'Carambola', 6),
  
  -- Premium features
  ('FruitsPremium', 'Açaí', 1),
  ('FruitsPremium', 'Cupuaçu', 2),
  ('FruitsPremium', 'Jabuticaba', 3),
  ('FruitsPremium', 'Caju', 4);
