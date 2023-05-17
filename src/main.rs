use clap::Parser;

use std::fs::File;
use std::io::{self, BufReader};

mod block_height;

#[derive(Parser)]
struct Flags {
    #[clap(long)]
    file: String,

    /// Analyze block height.
    #[clap(long)]
    analyze_block_height: Option<bool>,
}

fn main() -> io::Result<()> {
    let flags = Flags::parse();
    let file = File::open(flags.file)?;
    let reader = BufReader::new(file);

    if let Some(true) = flags.analyze_block_height {
        block_height::analyze_block_height(reader).unwrap();
    }

    Ok(())
}
