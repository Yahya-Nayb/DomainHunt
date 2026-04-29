import dspy
import json
import os
import contextlib
from dspy.teleprompt import BootstrapFewShotWithRandomSearch

API_KEY = ""
lm = dspy.LM('groq/llama-3.1-8b-instant', api_key=API_KEY)
dspy.settings.configure(lm=lm)

class DomainBranding(dspy.Signature):
    """
    Elite Brand Strategist. 
    Rules: 
    1. Semantic Harmony: Two English words with positive, related meanings.
    2. Radio Test: Easy to spell, easy to hear, no ambiguous spelling.
    3. Length: Short and punchy.
    """
    niche = dspy.InputField(desc="The business category")
    domains = dspy.OutputField(desc="A comma-separated list of EXACTLY 10 elite .com domains")
    rationale = dspy.OutputField(desc="Brief explanation of the semantic harmony and radio test application")

class DomainGenerator(dspy.Module):
    def __init__(self):
        super().__init__()
        self.generate = dspy.ChainOfThought(DomainBranding)

    def forward(self, niche):
        return self.generate(niche=niche)

def get_full_trainset():
    data = [
        ("Productivity", "FastFlow.com, SharpTask.com, ClearGoal.com, PeakWork.com, BoldDone.com, QuickTask.com, SmartAim.com, PrimeFlow.com, HighGain.com, PureFocus.com"),
        ("Finance", "SafeVault.com, SolidCap.com, TrustBank.com, GrandFund.com, PrimeCoin.com, ClearVest.com, BoldBank.com, PureGain.com, GoldRate.com, BaseFund.com"),
        ("Nature", "GreenLeaf.com, PureRoot.com, WildBloom.com, FreshAir.com, EarthRise.com, BlueRiver.com, StonePath.com, LeafWay.com, WoodFlow.com, SkyHigh.com"),        
        ("Education", "WiseMind.com, SmartPath.com, BrightLearner.com, SkillBase.com, DeepStudy.com, MindGrow.com, ClearTutor.com, BrainGain.com, PeakClass.com, FastLearn.com"),
        ("Technology", "SmartLogic.com, QuickCode.com, TechRise.com, BrightSoft.com, FastLink.com, PureData.com, SharpTech.com, ClearWeb.com, BoldBase.com, PrimeByte.com"),
        ("Real Estate", "HomePath.com, LandMark.com, BlueStay.com, PrimePlot.com, SolidHome.com, GrandLand.com, SafeStay.com, ClearView.com, PeakPlace.com, PureLand.com"),
        ("Health", "PureLife.com, VitalFlow.com, TrueHealth.com, DailyVibe.com, FreshMind.com, PeakPulse.com, ClearBody.com, SoftCare.com, BraveLife.com, CalmDay.com"),
        ("Marketing", "BoldReach.com, FastGrow.com, SmartAds.com, HighRank.com, ClearBrand.com, PrimeGain.com, SharpAim.com, GrandMark.com, PureScale.com, BrightLead.com"),
        ("Logistics", "FastShip.com, SafeMove.com, QuickRoad.com, PrimePost.com, ClearPath.com, BoldLog.com, SwiftWay.com, SmartFleet.com, GrandFlow.com, PureDrop.com"),
        ("Travel", "WildTrip.com, BlueWay.com, GrandTour.com, PureStay.com, FastFly.com, SmartTrip.com, ClearSky.com, PeakView.com, BoldTrek.com, FreshGo.com"),
        ("Security", "SafeLock.com, IronGuard.com, BoldShield.com, PureCheck.com, SharpWatch.com, SolidGate.com, PrimeGuard.com, ClearLock.com, TrustShield.com, HardBase.com"),
        ("E-commerce", "QuickShop.com, SmartCart.com, PureBuy.com, FastDeal.com, GrandShop.com, BoldSale.com, PrimeMall.com, ClearPick.com, FreshBag.com, BestBuy.com"),
        ("Automotive", "FastDrive.com, PureMotor.com, SmartRide.com, BoldAuto.com, PrimeGear.com, SharpCar.com, GrandRoad.com, ClearWheel.com, SolidSpeed.com, QuickFix.com"),
        ("Food", "PureTaste.com, FreshBite.com, GoodCook.com, FastDish.com, SmartChef.com, GrandMeal.com, BoldFood.com, ClearEat.com, PrimePlate.com, SweetCuts.com"),
        ("Energy", "PurePower.com, BrightSun.com, FastVolt.com, ClearWatt.com, SmartGrid.com, BluePower.com, HighVolt.com, PeakLight.com, BoldHeat.com, SafeSun.com"),
        ("Fashion", "PureStyle.com, BoldLook.com, SmartWear.com, FreshGarb.com, ClearChic.com, GrandMode.com, PrimeSilk.com, SharpSuit.com, SoftTrend.com, HighVogue.com"),
        ("Legal", "JustLaw.com, TrueCase.com, SolidLaw.com, FairCourt.com, PureLegal.com, PrimeFirm.com, BoldLegal.com, SharpRule.com, ClearLaw.com, GrandCase.com"),
        ("Construction", "HardBuild.com, SolidRise.com, PrimeStone.com, GrandSite.com, SmartBuilt.com, ClearBase.com, BoldBuild.com, PureWall.com, StrongTop.com, PeakBuild.com"),
        ("Gaming", "FastPlay.com, PureGame.com, SmartWin.com, BoldPro.com, GrandGame.com, SharpPlay.com, QuickPlay.com, PrimeEsport.com, ClearGame.com, PeakLevel.com"),
        ("HR", "SmartTeam.com, PureWork.com, BoldStaff.com, PrimeHire.com, ClearRole.com, GrandStaff.com, FastJob.com, SharpTeam.com, BestHire.com, SolidTeam.com")
    ]
    return [dspy.Example(niche=n, domains=d, rationale="Applied Semantic Harmony and the Radio Test for maximum brandability.").with_inputs("niche") for n, d in data]

# 3. المتريك المطور (The Judge)
def smart_metric(example, pred, trace=None):
    try:
        raw_domains = [d.strip() for d in pred.domains.split(",") if d.strip()]
        
        if len(raw_domains) != 10: return False
        
        if not all(d.lower().endswith(".com") for d in raw_domains): return False
        
        for d in raw_domains:
            name_only = d.replace(".com", "")
            if len(name_only) > 15: return False
            for i in range(len(name_only) - 1):
                if name_only[i] == name_only[i+1]:
                    return False
        
        if len(pred.rationale) < 40: return False
        
        return True
    except:
        return False

def train():
    print("🚀 Starting High-Level Optimization...")
    trainset = get_full_trainset()
    
    config = BootstrapFewShotWithRandomSearch(
        metric=smart_metric,
        max_bootstrapped_demos=3,
        max_labeled_demos=4,
        num_candidate_programs=8, 
        num_threads=1
    )
    
    agent = DomainGenerator()
    optimized_agent = config.compile(agent, trainset=trainset)
    
    optimized_agent.save("optimized_model.json")
    print("✅ Success! optimized_model.json created.")

if __name__ == "__main__":
    train()