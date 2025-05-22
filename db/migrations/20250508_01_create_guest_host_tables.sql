DROP TABLE IF EXISTS appointment_host CASCADE;
DROP TABLE IF EXISTS appointment_visitor CASCADE;
CREATE TABLE appointment_host (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    host_id INTEGER NOT NULL REFERENCES users(id),
    tag VARCHAR(255) NOT NULL DEFAULT('Host')
);

CREATE TABLE appointment_guest (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    visitor_id INTEGER NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
    tag VARCHAR(255) NOT NULL DEFAULT('Guest')
);