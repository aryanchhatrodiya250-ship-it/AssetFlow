from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from bson import ObjectId
import time

from apps.core.mongo_client import get_db
from apps.investments.serializers import GoalSerializer

db = get_db()

class GoalListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        client_id = request.query_params.get("client_id")
        
        if user.role == "Client":
            client_id = user.id
        elif not client_id:
            return Response({"error": "client_id query parameter is required for advisors"}, status=status.HTTP_400_BAD_REQUEST)
            
        goals = list(db.goals.find({"client_id": client_id}))
        for goal in goals:
            goal["id"] = str(goal["_id"])
            del goal["_id"]
            
        return Response(goals)

    def post(self, request):
        serializer = GoalSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        data = serializer.validated_data
        if request.user.role == "Client":
            data["client_id"] = request.user.id
            
        target = data["target_amount"]
        curr = data["current_amount"]
        data["progress_pct"] = round((curr / target) * 100, 2) if target > 0 else 0.0
        data["created_at"] = time.time()
        data["updated_at"] = time.time()
        
        result = db.goals.insert_one(data)
        data["id"] = str(result.inserted_id)
        del data["_id"]
        
        return Response(data, status=status.HTTP_201_CREATED)


class GoalDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            goal = db.goals.find_one({"_id": ObjectId(pk)})
        except Exception:
            return Response({"error": "Invalid goal ID"}, status=status.HTTP_400_BAD_REQUEST)
            
        if not goal:
            return Response({"error": "Goal not found"}, status=status.HTTP_404_NOT_FOUND)
            
        if request.user.role == "Client" and goal["client_id"] != request.user.id:
            return Response({"error": "Unauthorized access"}, status=status.HTTP_403_FORBIDDEN)
            
        goal["id"] = str(goal["_id"])
        del goal["_id"]
        return Response(goal)

    def put(self, request, pk):
        try:
            goal = db.goals.find_one({"_id": ObjectId(pk)})
        except Exception:
            return Response({"error": "Invalid goal ID"}, status=status.HTTP_400_BAD_REQUEST)
            
        if not goal:
            return Response({"error": "Goal not found"}, status=status.HTTP_404_NOT_FOUND)
            
        if request.user.role == "Client" and goal["client_id"] != request.user.id:
            return Response({"error": "Unauthorized access"}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = GoalSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        data = serializer.validated_data
        data["client_id"] = goal["client_id"]
        
        target = data["target_amount"]
        curr = data["current_amount"]
        data["progress_pct"] = round((curr / target) * 100, 2) if target > 0 else 0.0
        data["updated_at"] = time.time()
        
        db.goals.update_one({"_id": ObjectId(pk)}, {"$set": data})
        data["id"] = pk
        return Response(data)

    def delete(self, request, pk):
        try:
            goal = db.goals.find_one({"_id": ObjectId(pk)})
        except Exception:
            return Response({"error": "Invalid goal ID"}, status=status.HTTP_400_BAD_REQUEST)
            
        if not goal:
            return Response({"error": "Goal not found"}, status=status.HTTP_404_NOT_FOUND)
            
        if request.user.role == "Client" and goal["client_id"] != request.user.id:
            return Response({"error": "Unauthorized access"}, status=status.HTTP_403_FORBIDDEN)
            
        db.goals.delete_one({"_id": ObjectId(pk)})
        return Response({"message": "Goal deleted successfully"})


class PortfolioAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        client_id = request.query_params.get("client_id")
        
        if user.role == "Client":
            client_id = user.id
        elif not client_id:
            return Response({"error": "client_id query parameter is required for staff"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Fetch assets
        assets = list(db.assets.find({"owner_id": client_id, "status": "Active"}))
        total_value = sum(a.get("current_value", 0.0) for a in assets)
        total_invested = sum(a.get("purchase_price", 0.0) for a in assets)
        
        # Categorized allocation split
        allocation = {}
        for a in assets:
            cat = a.get("category", "Other Assets")
            allocation[cat] = allocation.get(cat, 0.0) + a.get("current_value", 0.0)
            
        allocation_pct = {}
        for cat, val in allocation.items():
            allocation_pct[cat] = round((val / total_value) * 100, 2) if total_value > 0 else 0.0
            
        # Risk assessment: calculate weighted score
        # High risk: Crypto, Stocks, Private Equity (score = 3)
        # Moderate risk: Mutual Funds, Businesses, Collectibles (score = 2)
        # Low risk: Gold & Precious Metals, Bonds, Fixed Deposits, Real Estate (score = 1)
        high_risk_value = 0.0
        moderate_risk_value = 0.0
        low_risk_value = 0.0
        
        for a in assets:
            cat = a.get("category")
            val = a.get("current_value", 0.0)
            if cat in ["Crypto", "Stocks", "Private Equity"]:
                high_risk_value += val
            elif cat in ["Mutual Funds", "Businesses", "Collectibles"]:
                moderate_risk_value += val
            else:
                low_risk_value += val
                
        risk_score = 0.0
        if total_value > 0:
            risk_score = ((high_risk_value * 3) + (moderate_risk_value * 2) + (low_risk_value * 1)) / total_value
            
        risk_profile_calculated = "Conservative"
        if risk_score > 2.2:
            risk_profile_calculated = "Aggressive"
        elif risk_score > 1.5:
            risk_profile_calculated = "Moderate"
            
        # Calculate overall returns & profit
        returns = total_value - total_invested
        returns_pct = round((returns / total_invested) * 100, 2) if total_invested > 0 else 0.0
        
        # Calculate diversification score (Entropy score mockup or index)
        # Higher count of categories -> Higher diversification rating
        category_count = len(allocation)
        diversification_rating = "Low"
        if category_count >= 5:
            diversification_rating = "Excellent"
        elif category_count >= 3:
            diversification_rating = "Good"
            
        # Recommendations
        recommendations = []
        if risk_profile_calculated == "Aggressive" and allocation_pct.get("Crypto", 0) > 30:
            recommendations.append("High Crypto exposure. Consider rebalancing into Bonds or Fixed Deposits to hedge risk.")
        if allocation_pct.get("Real Estate", 0) > 60:
            recommendations.append("Overweight in Real Estate. Liquidating or halting new properties to invest in mutual funds could enhance liquidity.")
        if category_count < 3:
            recommendations.append("Low diversification. Consider adding Gold or Stocks to build a resilient portfolio.")
            
        if not recommendations:
            recommendations.append("Your asset allocation aligns nicely with your calculated risk profiles. Keep regular investments active.")
            
        return Response({
            "total_value": total_value,
            "total_invested": total_invested,
            "net_returns": returns,
            "returns_pct": returns_pct,
            "allocation": allocation,
            "allocation_pct": allocation_pct,
            "risk_profile_calculated": risk_profile_calculated,
            "weighted_risk_score": round(risk_score, 2),
            "diversification_rating": diversification_rating,
            "recommendations": recommendations,
            "projected_yearly_value": round(total_value * 1.09, 2), # 9% average CAGR mock projection
            "projected_returns_five_years": round(total_value * 1.53, 2) # 53% return mock projection
        })
