-- NailCare – dữ liệu mẫu để chạy thử (giá VNĐ). Tài khoản đăng nhập tạo bằng: npm run seed:users
-- Ảnh mẫu nail là hình minh họa SVG trong public/designs; khi dùng thật, quản trị viên tải ảnh chụp lên.

insert into public.store_settings (id, store_name, address, phone, open_time, close_time, slot_minutes,
                                   capacity_per_slot, closed_weekdays, intro)
values (1, 'Thủy Nail', 'Cập nhật địa chỉ trong trang Quản trị → Cửa hàng', '0901234567', '09:00', '21:00', 30, 3, '{}',
        'Tiệm nail nhỏ, làm kỹ từng ngón. Đặt lịch trước để không phải chờ – tiệm xác nhận lịch qua website.')
on conflict (id) do nothing;

insert into public.service_categories (name, sort_order) values
  ('Sơn gel', 1), ('Đắp – úp móng', 2), ('Nail art', 3), ('Chăm sóc móng', 4);

insert into public.services (category_id, name, description, duration_minutes, price)
select c.id, s.name, s.description, s.duration, s.price
from (values
  ('Sơn gel',        'Sơn gel trơn',            'Sơn gel một màu, bền màu 2–3 tuần.',                    45, 150000),
  ('Sơn gel',        'Sơn gel mắt mèo',         'Hiệu ứng ánh kim mắt mèo theo góc nhìn.',               60, 200000),
  ('Sơn gel',        'Sơn gel ombre',           'Chuyển màu nhẹ từ gốc đến đầu móng.',                   60, 220000),
  ('Đắp – úp móng',  'Đắp bột',                 'Nối dài và tạo form móng bằng bột.',                    90, 350000),
  ('Đắp – úp móng',  'Úp móng gel',             'Úp móng giả bằng gel, form tự nhiên.',                  75, 300000),
  ('Nail art',       'Vẽ nail art 10 ngón',     'Vẽ họa tiết theo mẫu hoặc theo ý khách.',               60, 250000),
  ('Nail art',       'Đính đá',                 'Đính đá, charm trang trí theo mẫu.',                    45, 180000),
  ('Chăm sóc móng',  'Chăm sóc móng tay',       'Cắt da, dũa form, dưỡng móng.',                         30, 100000),
  ('Chăm sóc móng',  'Chăm sóc móng chân',      'Ngâm chân, cắt da, dũa form, dưỡng.',                   45, 120000),
  ('Chăm sóc móng',  'Tháo gel / bột',          'Tháo lớp gel hoặc bột cũ, không hại móng thật.',        15, 50000)
) as s(cat, name, description, duration, price)
join public.service_categories c on c.name = s.cat;

insert into public.design_categories (name) values
  ('Đơn giản'), ('Ombre'), ('Mắt mèo'), ('Đính đá'), ('Vẽ họa tiết'), ('Cô dâu');

insert into public.nail_designs (category_id, name, description, image_url, reference_price)
select c.id, d.name, d.description, d.image, d.price
from (values
  ('Đơn giản',     'French đầu móng trắng',   'Nền nude, viền trắng mảnh – hợp đi làm.',            '/designs/01-french.svg',     150000),
  ('Đơn giản',     'Nude bóng',               'Một màu nude bóng, sạch và nhẹ nhàng.',              '/designs/02-nude.svg',       150000),
  ('Ombre',        'Ombre hồng sữa',          'Hồng sữa chuyển trong, nhìn mềm tay.',               '/designs/03-ombre-pink.svg', 220000),
  ('Ombre',        'Ombre cam đào',           'Cam đào ấm, hợp da sáng và da ngăm.',                '/designs/04-ombre-peach.svg',220000),
  ('Mắt mèo',      'Mắt mèo bạc',             'Ánh kim bạc chạy theo góc nhìn.',                    '/designs/05-cateye-silver.svg', 200000),
  ('Mắt mèo',      'Mắt mèo rượu vang',       'Đỏ rượu vang ánh kim, sang và nổi.',                 '/designs/06-cateye-wine.svg', 200000),
  ('Đính đá',      'Đính đá gốc móng',        'Nền hồng nhạt, đá nhỏ ở gốc móng.',                  '/designs/07-gem-base.svg',   330000),
  ('Đính đá',      'Ngọc trai và nơ',         'Ngọc trai, nơ nhỏ trên nền trắng sữa.',              '/designs/08-pearl.svg',      360000),
  ('Vẽ họa tiết',  'Hoa nhí',                 'Hoa nhí vẽ tay trên nền kem.',                       '/designs/09-flowers.svg',    400000),
  ('Vẽ họa tiết',  'Vân đá cẩm thạch',        'Vân đá xám trắng, viền nhũ vàng.',                   '/designs/10-marble.svg',     400000),
  ('Cô dâu',       'Cô dâu trắng ngọc',       'Trắng ngọc, đá và nhũ – cho ngày cưới.',             '/designs/11-bridal.svg',     480000),
  ('Cô dâu',       'Hồng cưới nhũ vàng',      'Hồng nude, nhũ vàng mảnh ở đầu móng.',               '/designs/12-blush-gold.svg', 420000)
) as d(cat, name, description, image, price)
join public.design_categories c on c.name = d.cat;

-- Dịch vụ đi kèm mỗi mẫu (chọn mẫu ⇒ tự thêm các dịch vụ này khi đặt lịch)
insert into public.design_services (design_id, service_id)
select d.id, s.id
from (values
  ('French đầu móng trắng', 'Sơn gel trơn'),
  ('Nude bóng',             'Sơn gel trơn'),
  ('Ombre hồng sữa',        'Sơn gel ombre'),
  ('Ombre cam đào',         'Sơn gel ombre'),
  ('Mắt mèo bạc',           'Sơn gel mắt mèo'),
  ('Mắt mèo rượu vang',     'Sơn gel mắt mèo'),
  ('Đính đá gốc móng',      'Sơn gel trơn'),   ('Đính đá gốc móng', 'Đính đá'),
  ('Ngọc trai và nơ',       'Sơn gel trơn'),   ('Ngọc trai và nơ',  'Đính đá'),
  ('Hoa nhí',               'Sơn gel trơn'),   ('Hoa nhí',          'Vẽ nail art 10 ngón'),
  ('Vân đá cẩm thạch',      'Sơn gel trơn'),   ('Vân đá cẩm thạch', 'Vẽ nail art 10 ngón'),
  ('Cô dâu trắng ngọc',     'Úp móng gel'),    ('Cô dâu trắng ngọc','Đính đá'),
  ('Hồng cưới nhũ vàng',    'Sơn gel ombre'),  ('Hồng cưới nhũ vàng','Đính đá')
) as x(design, service)
join public.nail_designs d on d.name = x.design
join public.services s on s.name = x.service;
