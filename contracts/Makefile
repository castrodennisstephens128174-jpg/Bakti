.PHONY: test build optimize lint clean

test:
	cargo test --locked

build:
	cargo build --locked --release --target wasm32-unknown-unknown

optimize:
	stellar contract optimize --wasm target/wasm32-unknown-unknown/release/*.wasm

lint:
	cargo clippy -- -D warnings

clean:
	cargo clean
