variable "aws_region" {
  default = "ap-south-1"
}

variable "ami_id" {
  default = "ami-02b8269d5e85954ef"
}

variable "docker_images" {
  type        = map(string)
  description = "Docker images for each service"
  default = {
    frontend = "pramod051/devops-app-frontend:latest"
    backend  = "pramod051/devops-app-backend:latest"
  }
}
