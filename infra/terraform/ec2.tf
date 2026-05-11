# 첫 번째 인스턴스
resource "aws_instance" "team_worker_1" {
  ami           = "ami-0d4c056a16f3ae150" # 팀원이 사용한 AMI ID
  instance_type = "t3.micro"
  subnet_id     = aws_subnet.public[0].id
  vpc_security_group_ids = [aws_security_group.eks_nodes.id]
  associate_public_ip_address = true # 퍼블릭이므로 공인 IP 활성화 확인
  
  tags = { Name = "Bastion-Jump-Host" }
}

# 두 번째 인스턴스
resource "aws_instance" "team_worker_2" {
  ami           = "ami-0d4c056a16f3ae150" # 팀원이 사용한 AMI ID (같을 수도 있음)
  instance_type = "t2.micro"
  subnet_id     = aws_subnet.private[0].id
  vpc_security_group_ids = [aws_security_group.eks_nodes.id]
  associate_public_ip_address = false # 프라이빗이므로 공인 IP 비활성화

  tags = { Name = "Team01-Backend-New" }
}