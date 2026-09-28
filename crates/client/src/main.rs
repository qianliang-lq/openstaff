use clap::Parser;

#[derive(Parser, Debug)]
#[command(
    name = "openstaff-client",
    version,
    about = "OpenStaff 本地客户端 / OpenStaff Local Client",
    long_about = None
)]
struct Args {
    #[command(subcommand)]
    command: Option<Commands>,
}

#[derive(Parser, Debug)]
enum Commands {
    Version,
}

fn main() -> anyhow::Result<()> {
    let args = Args::parse();

    match args.command {
        Some(Commands::Version) | None => {
            println!("openstaff-client v{}", env!("CARGO_PKG_VERSION"));
            println!("OpenStaff 本地客户端 / OpenStaff Local Client");
            println!("License: Apache-2.0");
        }
    }

    Ok(())
}
