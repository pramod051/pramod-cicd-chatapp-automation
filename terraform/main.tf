terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

resource "aws_security_group" "app_sg" {
  name        = "devops-app-sg"
  description = "Security group for DevOps app"

#resource "aws_eip" "my_eip" {
#  vpc = true
#}

#resource "aws_eip_association" "eip_assoc" {
#  instance_id   = aws_instance.my_ec2.id
#  allocation_id = aws_eip.my_eip.id
#}


  # Frontend
  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Backend
  ingress {
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # SSH (Optional: limit to your IP for security)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # All outbound allowed
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "app_server" {
  ami           = var.ami_id
  instance_type = "t2.micro"
  vpc_security_group_ids = [aws_security_group.app_sg.id]

  user_data = <<-EOF
      #!/bin/bash
      sudo apt update -y
      sudo apt install -y docker.io
      sudo systemctl start docker
      sudo systemctl enable docker

      # Pull Docker images
      sudo docker pull ${var.docker_images["frontend"]}
      sudo docker pull ${var.docker_images["backend"]}
      sudo docker pull mongo:6

      # MongoDB container
      sudo docker volume create mongo-data
      sudo docker run -d --restart always \
        --name mongo \
        -p 27017:27017 \
        -v mongo-data:/data/db \
        mongo:6

      # Frontend container
      sudo docker run -d --restart always \
        -p 3000:3000 \
        ${var.docker_images["frontend"]}

      # Backend container
      sudo docker run -d --restart always \
        -p 5000:5000 \
        -e MONGO_URL="mongodb://mongodb:27017/talkwithteams" \
        ${var.docker_images["backend"]}
  EOF

  tags = {
    Name = "devops-portfolio-app"
  }
}

#output "ec2_public_ip" {
#  value = aws_eip.my_eip.public_ip
#}

output "instance_public_ip" {
  value = aws_instance.app_server.public_ip
}
