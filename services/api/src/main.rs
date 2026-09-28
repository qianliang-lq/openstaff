use openstaff_protocol::Message;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    println!("OpenStaff API Service (placeholder)");
    println!("Version: {}", env!("CARGO_PKG_VERSION"));

    let _msg = Message {
        content: "API service initialized".to_string(),
    };

    println!("✅ Protocol integration verified");
    println!("⏳ HTTP/WebSocket server - coming in T1");
    println!("⏳ Agent CRUD endpoints - coming in T1");
    println!("⏳ Session management - coming in T1");

    Ok(())
}
