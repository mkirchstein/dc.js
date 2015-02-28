require 'date'
require 'tempfile'
require 'csv'

headers = ['date', 'uid', 'gender', 'age', 'incentive', 'amount', 'amount_possible']
rows = []
users = []
num_users = 10
incentives = [
  { name: 'steps', label: 'Step Tracking', likelyhood: 0.2, efficency: 0.9 }, 
  { name: 'sleep', label: 'Sleep Tracking', likelyhood: 0.5, efficency: 0.7 },
  { name: 'food', label: 'Food Tracking', likelyhood: 0.7, efficency: 0.5 }
]
genders = ['female','male']
daily_max = 5
daily_tracked_rate = 0.5
start_date = Date.new(2014, 01, 01)
end_date = Date.new(2014, 12, 31)

num_users.times do |i|
  user = { 
    uid: (0...10).map { ('a'..'z').to_a[rand(26)] }.join,
    gender: genders[rand.round],
    age: 25 + (rand * 10).round + (rand * 10).round
  }
  # puts user
  users << user
end

puts headers.join(',')+"\n"

(start_date..end_date).each do |date|
  # puts date
  users.each do |user|
    incentives.each do |incentive|
      if rand > incentive[:likelyhood]
        amount = (daily_max * rand(incentive[:efficency])).round
        row = [date, user[:uid], user[:gender], user[:age], incentive[:name], amount, daily_max]
        # rows << row
        puts row.join(',')+"\n"
      end
    end
  end
end

# puts rows.join(',')+"\n"

# file = Tempfile.new('~/Dev/dc.js/tmp/incentives.csv')
# file = Tempfile.new('incentives')
# puts file.path
# CSV.open(file, 'w') do |csv|
#   csv << headers
#   rows.each do |row|
#     csv << row
#   end
# end



