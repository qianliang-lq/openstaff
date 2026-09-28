pub struct Agent {
    name: String,
}

impl Agent {
    pub fn new(name: String) -> Self {
        Self { name }
    }

    pub fn name(&self) -> &str {
        &self.name
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agent_creation() {
        let agent = Agent::new("test-agent".to_string());
        assert_eq!(agent.name(), "test-agent");
    }
}
