select 
	user_incentive_periods.start_date AS date, 
	users.guid AS uid, 
	profiles.gender AS gender, 
	FLOOR(DATEDIFF(CURDATE(),profiles.birth_date)/365) AS age, 
	incentives.title AS incentive, 
	user_incentive_periods.amount_earned, 
	user_incentive_periods.* from user_incentive_periods
inner join user_incentives on user_incentives.id = user_incentive_periods.user_incentive_id
inner join incentives on incentives.id = user_incentives.incentive_id
inner join user_incentive_groups on user_incentive_groups.id = user_incentives.user_incentive_group_id
inner join users on users.guid = user_incentive_groups.user_guid
inner join profiles on profiles.user_id = users.id
where user_incentives.incentive_id in (3,4)