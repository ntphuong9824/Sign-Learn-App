package com.signlearn.dto;

import java.util.List;

public class TranslateResponse {
    private PoseData poseData;
    private String animationUrl;

    public TranslateResponse() {}

    public TranslateResponse(PoseData poseData, String animationUrl) {
        this.poseData = poseData;
        this.animationUrl = animationUrl;
    }

    public PoseData getPoseData() { return poseData; }
    public void setPoseData(PoseData poseData) { this.poseData = poseData; }
    public String getAnimationUrl() { return animationUrl; }
    public void setAnimationUrl(String animationUrl) { this.animationUrl = animationUrl; }

    public static class PoseData {
        private List<List<Landmark>> landmarks;
        private List<List<Landmark>> worldLandmarks;
        private Object transformation;

        public PoseData() {}

        public List<List<Landmark>> getLandmarks() { return landmarks; }
        public void setLandmarks(List<List<Landmark>> landmarks) { this.landmarks = landmarks; }
        public List<List<Landmark>> getWorldLandmarks() { return worldLandmarks; }
        public void setWorldLandmarks(List<List<Landmark>> worldLandmarks) { this.worldLandmarks = worldLandmarks; }
        public Object getTransformation() { return transformation; }
        public void setTransformation(Object transformation) { this.transformation = transformation; }
    }

    public static class Landmark {
        private float x;
        private float y;
        private float z;
        private float visibility;

        public Landmark() {}

        public Landmark(float x, float y, float z, float visibility) {
            this.x = x;
            this.y = y;
            this.z = z;
            this.visibility = visibility;
        }

        public float getX() { return x; }
        public void setX(float x) { this.x = x; }
        public float getY() { return y; }
        public void setY(float y) { this.y = y; }
        public float getZ() { return z; }
        public void setZ(float z) { this.z = z; }
        public float getVisibility() { return visibility; }
        public void setVisibility(float visibility) { this.visibility = visibility; }
    }
}