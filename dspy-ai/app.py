import dspy
import sys
import json
import os

os.environ["DSPY_CACHEDIR"] = "" 

class DomainBranding(dspy.Signature):
    """
    Elite Brand Strategist. 
    Strict Rules: 10 .com domains, two English words, high brandability, follow Radio Test.
    """
    niche = dspy.InputField()
    domains = dspy.OutputField(desc="Comma-separated list of 10 .com domains")
    rationale = dspy.OutputField()

class DomainGenerator(dspy.Module):
    def __init__(self):
        super().__init__()
        self.generate = dspy.ChainOfThought(DomainBranding)
    def forward(self, niche):
        return self.generate(niche=niche)

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing arguments"}))
        return

    target_niche = sys.argv[1]
    api_key = sys.argv[2]

    try:
        lm = dspy.LM('groq/llama-3.1-8b-instant', api_key=api_key)
        
        with dspy.context(lm=lm):
            agent = DomainGenerator()
            
            model_path = os.path.join(os.path.dirname(__file__), "optimized_model.json")
            if os.path.exists(model_path):
                agent.load(model_path)
            
            prediction = agent.forward(niche=target_niche)
            
            raw_domains = prediction.domains.split(",")
            clean_domains = []
            for d in raw_domains:
                clean = d.strip().split(". ")[-1] if ". " in d else d.strip()
                if clean: clean_domains.append(clean.lower())

            output = {
                "domains": clean_domains[:10],
                "strategy": prediction.rationale
            }
            print(json.dumps(output))

    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()