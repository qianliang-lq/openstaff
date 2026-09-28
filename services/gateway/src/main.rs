use openstaff_protocol::Message;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    println!("OpenStaff LLM Gateway Service (placeholder)");
    println!("Version: {}", env!("CARGO_PKG_VERSION"));

    let _msg = Message {
        content: "LLM Gateway initialized".to_string(),
    };

    println!("✅ Protocol integration verified");
    println!("⏳ Multi-model routing - coming in T1");
    println!("⏳ Rate limiting - coming in T2");
    println!("⏳ Key management - coming in T3");

    Ok(())
}
